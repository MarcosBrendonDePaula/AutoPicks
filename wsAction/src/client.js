// ==UserScript==
// @name         WebSocket Client for Tampermonkey
// @namespace    http://tampermonkey.net/
// @version      0.9
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

    function waitForScriptsToLoad(callback) {
        if (typeof jQuery !== 'undefined' && typeof io !== 'undefined') {
            callback();
        } else {
            setTimeout(() => waitForScriptsToLoad(callback), 100);
        }
    }

    socketScript.onload = () => {
        waitForScriptsToLoad(() => {
            const socket = io('https://127.0.0.1:9515/', { secure: true }); // Conexão segura via HTTPS

            let isMaster = false; // Variável para controlar se o cliente é o mestre

            // Função para enviar comandos
            function sendCommand(command, data) {
                if (isMaster) {
                    socket.emit('master:command', { command, data });
                } else {
                    console.log('Este cliente não é o mestre.');
                }
            }

            // Função para capturar ações e enviá-las ao servidor
            function captureAction(event) {
                if (isMaster) {
                    const element = event.target;
                    const tagName = element.tagName;
                    const action = event.type;
                    const value = element.value;
                    const selector = getElementXPath(element);
                    sendCommand('replicateAction', { tagName, action, value, selector });
                }
            }

            // Função para obter o XPath de um elemento
            function getElementXPath(element) {
                const paths = [];
                for (; element && element.nodeType == Node.ELEMENT_NODE; element = element.parentNode) {
                    let index = 0;
                    for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
                        if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE) continue;
                        if (sibling.nodeName == element.nodeName) ++index;
                    }
                    const tagName = element.nodeName.toLowerCase();
                    const pathIndex = (index ? `[${index + 1}]` : '');
                    paths.unshift(`${tagName}${pathIndex}`);
                }
                return paths.length ? `/${paths.join('/')}` : null;
            }

            // Adiciona um botão na página para tornar o cliente o mestre
            function addMasterControlButton() {
                const button = document.createElement('button');
                button.innerText = 'Tornar-se Mestre';
                button.style.position = 'fixed';
                button.style.top = '10px';
                button.style.right = '10px';
                button.style.zIndex = 1000;
                button.addEventListener('click', () => {
                    isMaster = true;
                    alert('Este cliente agora é o mestre.');
                });
                document.body.appendChild(button);
            }

            socket.on('connect', () => {
                console.log('Conectado ao servidor WebSocket');

                // Adiciona o botão para tornar-se mestre
                addMasterControlButton();

                // Recebe comandos do mestre e do servidor
                socket.on('command', (data) => {
                    if (!data) return;
                    const { command, data: payload } = data;
                    console.log(`Recebeu comando: ${command}`);
                    if (command === 'browser:openPage') {
                        window.location.href = payload;
                    } else if (command === 'browser:reloadPage') {
                        window.location.reload();
                    } else if (command === 'blockpick:collectRewards') {
                        collectRewards();
                    } else if (command === 'global:control') {
                        executeGlobalControl(payload);
                    } else if (command === 'button:click') {
                        clickButton(payload);
                    } else if (command === 'replicateAction') {
                        if (!payload) return;
                        executeReplicatedAction(payload);
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

            function executeGlobalControl(data) {
                const inputs = document.querySelectorAll('input[type="text"], input[type="password"], textarea');
                inputs.forEach((input, index) => {
                    input.value = data || `Valor ${index}`;
                    const event = new Event('input', { bubbles: true });
                    input.dispatchEvent(event);
                });
                console.log('Inputs preenchidos.');
            }

            function clickButton(selector) {
                const button = document.querySelector(selector);
                if (button) {
                    button.click();
                    console.log(`Botão com o seletor "${selector}" foi clicado.`);
                } else {
                    console.log(`Botão com o seletor "${selector}" não foi encontrado.`);
                }
            }

            function executeReplicatedAction(payload) {
                const { selector, action, value } = payload;
                console.log(`Tentando executar ação: ${action} em ${selector}`);
                const element = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (element) {
                    console.log(`Elemento encontrado: ${element.tagName}`);
                    if (action === 'click') {
                        element.click();
                    } else if (action === 'input' || action === 'change') {
                        element.value = value;
                        element.dispatchEvent(new Event(action, { bubbles: true }));
                    }
                    console.log(`Ação replicada: ${action} em ${selector}`);
                } else {
                    console.log(`Elemento não encontrado para replicar a ação: ${selector}`);
                }
            }

            // Adiciona evento de teclado para tornar-se mestre com Ctrl+M
            document.addEventListener('keydown', (event) => {
                if (event.ctrlKey && event.key === 'm') {
                    isMaster = true;
                    alert('Este cliente agora é o mestre.');
                } else if (isMaster && event.ctrlKey && event.key === 'Enter') {
                    sendCommand('global:control', 'Valor de exemplo');
                } else if (isMaster && event.ctrlKey && event.key === 'b') {
                    // Enviar comando para clicar em um botão com um seletor específico
                    const selector = 'button.exemplo'; // Troque pelo seletor do botão que deseja controlar
                    sendCommand('button:click', selector);
                }
            });

            // Captura ações de clique e mudança de valor em elementos de input
            document.addEventListener('click', captureAction, true);
            document.addEventListener('input', captureAction, true);
            document.addEventListener('change', captureAction, true);
        });
    };
})();
