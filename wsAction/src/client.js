// ==UserScript==
// @name         WebSocket Client for Tampermonkey
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Connects to a secure WebSocket server and performs actions based on commands received
// @author       Your Name
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Incluindo a biblioteca jQuery e Socket.IO diretamente no script
    const jqueryScript = document.createElement('script');
    jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
    document.head.appendChild(jqueryScript);

    const socketScript = document.createElement('script');
    socketScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.4.0/socket.io.js'; // Caminho para a biblioteca Socket.IO
    document.head.appendChild(socketScript);

    socketScript.onload = () => {
        const socket = io('https://127.0.0.1:9515/', { secure: true }); // Conexão segura via HTTPS

        socket.on('connect', () => {
            console.log('Conectado ao servidor WebSocket');

            // Exemplo de ação para abrir a mesma página
            socket.on('browser:openPage', (url) => {
                console.log('Recebeu comando para abrir a mesma página:', url);
                window.location.href = url; // Redireciona para a URL recebida
            });

            // Exemplo de ação para coletar recompensas
            socket.on('blockpick:collectRewards', () => {
                console.log('Recebeu comando para coletar recompensas');
                collectRewards();
            });

            // Outras ações podem ser adicionadas conforme necessário
        });

        socket.on('disconnect', () => {
            console.log('Desconectado do servidor WebSocket');
        });
    };

    function collectRewards() {
        // Usar jQuery para procurar pelo elemento <span> com o texto "My Rewards"
        const rewardsButton = $("span").filter(function() {
            return $(this).text().trim() === "My Rewards";
        });

        if (rewardsButton.length) {
            // Clicar no botão "My Rewards"
            console.log('Botão "My Rewards" encontrado, clicando nele...');
            rewardsButton.click();

            // Aguardar 10 segundos
            setTimeout(() => {
                console.log('10 segundos se passaram após clicar no botão "My Rewards"');

                // Procurar pelo botão com o texto "Claim"
                const claimButton = $("span").filter(function() {
                    return $(this).text().trim() === "Claim";
                });

                if (claimButton.length) {
                    // Clicar no botão "Claim"
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
})();
