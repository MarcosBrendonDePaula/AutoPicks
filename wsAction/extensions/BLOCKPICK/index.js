const express = require("express");
const fs = require('fs');
const path = require('path');

module.exports = (WSIO, APP, RL) => {
    // Cria um novo roteador para a extensão
    const ROUTER = express.Router();
    
    // Nome da extensão
    const NAME = "BLOCKPICK"; 
    // Estado de habilitação da extensão
    const ENABLED = true;

    // Definição de eventos IO específicos para esta extensão
    const IOEVENTS = {
        "teste": {
            description: "Descrição do evento de teste",
            _function: (data) => {
                console.log(`${NAME} teste event received:`, data);
                // Lógica para o evento de teste
            }
        }
    };

    const COMMANDS = {
        "collectRewards": {
            description: "Coleta as recompensas do blockpick",
            _function: (data) => {
                WSIO.emit(`${NAME}:command`, {
                    command:"collectRewards",
                    data:{}
                })
            }
        }
    }

    /**
     * Função de inicialização da extensão.
     */
    const onInitialize = () => {
        console.log(`${NAME} initialized.`);
        // Lógica adicional de inicialização, se necessário
    };

    /**
     * Função de tratamento de erros da extensão.
     * 
     * @param {Error} error - O objeto de erro capturado
     */
    const onError = (error) => {
        console.error(`${NAME} error: ${error.message}`);
        // Lógica adicional de tratamento de erros
    };

    // Define a rota para retornar o arquivo client.js
    ROUTER.get("/client", (req, res) => {
        const filePath = path.resolve(__dirname, './client.js'); // Ajuste o caminho conforme necessário
        res.sendFile(filePath, (err) => {
            if (err) {
                res.status(500).send('Erro ao carregar o arquivo.');
            }
        });
    });
    const CLIENT_LINK=`${NAME}/client`

    return {
        NAME,
        ROUTER,
        ENABLED,
        IOEVENTS,
        COMMANDS,
        CLIENT_LINK,
        onInitialize,
        onError // Expor a função de erro para ser usada externamente
    };
};
