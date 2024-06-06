const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 9512;

app.use(express.json());
app.use(cors());

// Função para gerar um "pick" aleatório
function getRandomPick() {
    return {
        people: Math.floor(Math.random() * 2), // 0 ou 1
        option: Math.floor(Math.random() * 3)  // 0, 1 ou 2
    };
}

function generatePicks(count) {
    return Array.from({ length: count }, getRandomPick);
}

const pickCount = 6;

app.get('/picks', (req, res) => {
    console.log('Requisitado!');
    const picks = generatePicks(pickCount);
    res.json({ picks });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Will generate ${pickCount} picks on each request.`);
});
