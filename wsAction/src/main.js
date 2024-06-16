const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');
const readline = require('readline');
const { execSync } = require('child_process');

const PORT_WS_HTTP = 9514;
const PORT_WS_HTTPS = 9515;
const PORT_HTTP = 8080;

// Caminhos dos arquivos de certificado
const keyPath = path.resolve(__dirname, 'key.pem');
const certPath = path.resolve(__dirname, 'certificate.pem');

// Função para criar certificados se não existirem
function generateCertificates() {
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        console.log('Certificados não encontrados. Gerando certificados autoassinados...');
        execSync(`openssl genrsa -out ${keyPath} 2048`);
        execSync(`openssl req -new -key ${keyPath} -out csr.pem -subj "/CN=localhost"`);
        execSync(`openssl x509 -req -days 365 -in csr.pem -signkey ${keyPath} -out ${certPath}`);
        fs.unlinkSync('csr.pem'); // Remover CSR após a criação do certificado
        console.log('Certificados gerados.');
    }
}

// Gerar certificados se necessário
generateCertificates();

// Criando servidores HTTP e HTTPS para WebSocket
const httpServerWS = http.createServer();
const httpsOptionsWS = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
};
const httpsServerWS = https.createServer(httpsOptionsWS);

// Inicializando o Socket.IO para ambos os servidores
const io = socketIo({
    cors: {
        origin: '*' // Permitindo acesso de qualquer origem (CORS)
    }
});
io.attach(httpServerWS);
io.attach(httpsServerWS);

const connectedClients = new Set(); // Usando Set para armazenar clientes conectados

io.on('connection', (socket) => {
    console.log('Um cliente se conectou:', socket.id);
    connectedClients.add(socket);

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
        connectedClients.delete(socket);
    });

    // Recebendo comandos do mestre e retransmitindo para todos os clientes conectados
    socket.on('master:command', (data) => {
        io.emit('command', data);
    });
});

// Iniciando os servidores WebSocket
httpServerWS.listen(PORT_WS_HTTP, () => {
    console.log(`WebSocket HTTP Server is running on http://127.0.0.1:${PORT_WS_HTTP}`);
});

httpsServerWS.listen(PORT_WS_HTTPS, () => {
    console.log(`WebSocket HTTPS Server is running on https://127.0.0.1:${PORT_WS_HTTPS}`);
});

// Servidor HTTP para servir o arquivo client.js
const httpServer = http.createServer((req, res) => {
    if (req.url === '/client.js') {
        const filePath = path.join(__dirname, 'client.js');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Erro ao ler o arquivo client.js');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Arquivo não encontrado');
    }
});

httpServer.listen(PORT_HTTP, () => {
    console.log(`HTTP Server is running on http://127.0.0.1:${PORT_HTTP}`);
});

// Interface de linha de comando (CLI) para enviar comandos
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showMenu() {
    console.log(`
    Escolha uma opção:
    1. Listar clientes conectados
    2. Enviar comando para abrir uma página
    3. Enviar comando para coletar recompensas
    4. Enviar comando global de controle
    5. Enviar comando para clicar em um botão
    6. Enviar comando para recarregar a página
    7. Definir atraso máximo
    8. Sair
    `);
}

function listConnectedClients() {
    console.log('Clientes conectados:');
    connectedClients.forEach(client => {
        console.log(`- ID: ${client.id}`);
    });
    showMenu();
}

function promptOpenPage() {
    rl.question('Digite a URL da página para abrir: ', (url) => {
        io.emit('command', { command: 'browser:openPage', payload: url });
        console.log(`Comando para abrir a página "${url}" enviado.`);
        showMenu();
    });
}

function promptCollectRewards() {
    io.emit('command', { command: 'blockpick:collectRewards' });
    console.log('Comando para coletar recompensas enviado.');
    showMenu();
}

function promptGlobalControl() {
    rl.question('Digite o valor para preencher os inputs: ', (value) => {
        io.emit('command', { command: 'global:control', payload: value });
        console.log('Comando global de controle enviado.');
        showMenu();
    });
}

function promptClickButton() {
    rl.question('Digite o seletor do botão para clicar: ', (selector) => {
        io.emit('command', { command: 'button:click', payload: selector });
        console.log(`Comando para clicar no botão "${selector}" enviado.`);
        showMenu();
    });
}

function promptReloadPage() {
    io.emit('command', { command: 'browser:reloadPage' });
    console.log('Comando para recarregar a página enviado.');
    showMenu();
}

function promptSetMaxDelay() {
    rl.question('Digite o novo tempo máximo de atraso em segundos: ', (delay) => {
        const maxDelay = parseInt(delay) * 1000;
        io.emit('command', { command: 'setMaxDelay', data: maxDelay });
        console.log(`Novo tempo máximo de atraso definido para ${delay} segundos e enviado para todos os clientes.`);
        showMenu();
    });
}

rl.on('line', (input) => {
    const option = input.trim();
    switch (option) {
        case '1':
            listConnectedClients();
            break;
        case '2':
            promptOpenPage();
            break;
        case '3':
            promptCollectRewards();
            break;
        case '4':
            promptGlobalControl();
            break;
        case '5':
            promptClickButton();
            break;
        case '6':
            promptReloadPage();
            break;
        case '7':
            promptSetMaxDelay();
            break;
        case '8':
            rl.close();
            break;
        default:
            console.log('Opção inválida. Tente novamente.');
            showMenu();
    }
});

showMenu();
