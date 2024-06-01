const express = require('express');
const fs = require('fs');
const cors = require('cors'); // Importe o pacote cors
const app = express();
const PORT = 9512;

app.use(express.json());
app.use(cors()); // Use o middleware cors para permitir todas as origens

app.get('/picks', (req, res) => {
    fs.readFile('picks.json', 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Se o arquivo não existir, cria um arquivo inicial com dados padrão
                const initialData = { picks: [] };
                fs.writeFile('picks.json', JSON.stringify(initialData), (err) => {
                    if (err) {
                        console.error(err);
                        res.status(500).json({ error: 'Internal Server Error' });
                        return;
                    }
                    res.json(initialData);
                });
            } else {
                console.error(err);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        } else {
            const picks = JSON.parse(data);
            res.json(picks);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
