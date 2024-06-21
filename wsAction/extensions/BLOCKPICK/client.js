// ==UserScript==
// @name         WebSocket Client for Tampermonkey
// @namespace    http://tampermonkey.net/
// @version      0.13
// @description  Connects to a secure WebSocket server and performs actions based on commands received
// @author       Your Name
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    const MODULE_NAME = "BLOCKPICK"
    async function fetchWalletBalance() {
        // Função para pegar o valor de um cookie específico
        function getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            throw new Error(`Cookie ${name} not found`);
        }

        const url = "https://main-api.blockasset.co/graphql";
        const headers = {
            "credentials": "include",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
            "Accept": "*/*",
            "Accept-Language": "pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getCookie('accessToken')}`,  // Pega o token do cookie accessToken
            "Sec-GPC": "1",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
            "Priority": "u=1"
        };

        const body = JSON.stringify({
            "operationName": "getMyWallets",
            "variables": {
                "filter": {
                    "type": "CUSTODIAL"
                }
            },
            "query": `
                query getMyWallets($filter: WalletsFilterInput) {
                    myWallets(filter: $filter) {
                        count
                        limit
                        offset
                        data {
                            id
                            balance {
                                block
                                __typename
                            }
                            __typename
                        }
                        __typename
                    }
                }
            `
        });

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: body,
                mode: "cors"
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Obtendo o valor desejado da resposta
            const balanceBlock = result.data.myWallets.data[0].balance.block;
            console.log(balanceBlock); // Exibe o valor no console
            return balanceBlock; // Retorna o valor

        } catch (error) {
            console.error('Fetch error: ', error);
        }
    }
    
    const socket = io('https://127.0.0.1:9515/', { secure: true }); // Conexão segura via HTTPS
    socket.on('connect', () => {
        console.log('Conectado ao servidor WebSocket');
        socket.on(`${MODULE_NAME}:command`, (data) => {
            console.log(data)
            if (!data) return;
            const { command, data: payload } = data;
            if (command === `collectRewards`) {
                collectRewards();
            }else if (command === `getWalletCoins`) {
                getWalletCoins();
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('Desconectado do servidor WebSocket');
    });

    function collectRewards() {
        const rewardsButton = $("span").filter(function () {
            return $(this).text().trim() === "My Rewards";
        });

        if (rewardsButton.length) {
            console.log('Botão "My Rewards" encontrado, clicando nele...');
            rewardsButton.click();

            setTimeout(() => {
                console.log('10 segundos se passaram após clicar no botão "My Rewards"');

                const claimButton = $("span").filter(function () {
                    return $(this).text().trim() === "Claim";
                });

                if (claimButton.length) {
                    console.log('Botão "Claim" encontrado, clicando nele...');
                    claimButton.click();
                } else {
                    console.log('Botão "Claim" não encontrado');
                }
            }, 10000);
        } else {
            console.log('Botão "My Rewards" não encontrado');
        }
    }

    async function getWalletCoins() {
        let value = await fetchWalletBalance()
        socket.emit(`${MODULE_NAME}:walletCoin`, {
            value
        })
    }
})();
