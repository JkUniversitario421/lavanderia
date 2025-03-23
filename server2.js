const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const uri = "mongodb+srv://jkuniversitario421:<M@iden25654545>@cluster0.jz5ul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function conectarBanco() {
    try {
        await client.connect();
        console.log("MongoDB conectado com sucesso!");
    } catch (error) {
        console.error("Erro ao conectar ao MongoDB:", error);
        process.exit(1);
    }
}
conectarBanco();

async function criarUsuario(telefone, nome) {
    try {
        const db = client.db("botdb");
        const usuariosCollection = db.collection('usuarios');
        const usuarioExistente = await usuariosCollection.findOne({ telefone });

        if (usuarioExistente) {
            return 'Usuário já existe!';
        }

        const result = await usuariosCollection.insertOne({ telefone, nome });
        return result.acknowledged && result.insertedId ? `Usuário ${nome} criado com sucesso!` : 'Falha ao criar usuário!';
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return 'Erro ao criar usuário!';
    }
}

async function buscarUsuarioPorTelefone(telefone) {
    try {
        const db = client.db("botdb");
        const usuariosCollection = db.collection('usuarios');
        const usuario = await usuariosCollection.findOne({ telefone });
        return usuario ? usuario.nome : 'Usuário';
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return 'Usuário';
    }
}

async function excluirUsuario(telefone) {
    try {
        const db = client.db("botdb");
        const usuariosCollection = db.collection('usuarios');
        const result = await usuariosCollection.deleteOne({ telefone });
        return result.deletedCount === 1 ? `Usuário com telefone ${telefone} excluído.` : `Usuário não encontrado.`;
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        return 'Erro ao excluir usuário!';
    }
}

const menuOptions = `Escolha uma das opções abaixo:
1️⃣ Para saber como usar 🤷‍♀️🤷‍♂️
2️⃣ Informações técnicas 🧰
3️⃣ Iniciar lavagem 🔛
4️⃣ Finalizar lavagem 🔚
5️⃣ Entrar na fila de lavagem 🚶🚶🚶
6️⃣ Desistir da fila de lavagem 🚶🚶
7️⃣ Tabela de peso das roupas 👖🩲👗👕👚
8️⃣ Horário de funcionamento 🕒🕗🕤
9️⃣ Previsão do tempo ⛈️☀️🌤️🌨️
🔟 Dias de coleta de lixo ♻️`;

let lavagens = [];
let fila = [];

app.post('/webhook', async (req, res) => {
    console.log('Recebido:', JSON.stringify(req.body, null, 2));
    
    const intentName = req.body.queryResult.intent.displayName;
    const option = Number(req.body.queryResult.queryText);
    const telefone = req.body.originalDetectIntentRequest.payload.data?.from || ''; 

    const user = await buscarUsuarioPorTelefone(telefone);
    if (intentName === 'Mostrar Menu') {
        return res.json({ fulfillmentText: menuOptions });
    }

    switch (option) {
        case 1:
            return res.json({ fulfillmentText: `Siga as dicas para uma boa utilização pelo link:\nhttps://youtu.be/2O_PWz-0qic` });
        case 2:
            return res.json({ fulfillmentText: `🔧 Informações técnicas...` });
        case 3: {
            const currentTime = moment().tz("America/Sao_Paulo");
            const endTime = currentTime.clone().add(2, 'hours');
            lavagens.push({ user, startTime: currentTime.toISOString(), endTime: endTime.toISOString() });
            setTimeout(() => console.log(`🔔 Notificação: 5 minutos restantes para ${user}`), 115 * 60 * 1000);
            return res.json({ fulfillmentText: `Lavagem iniciada para *${user}*! ⏳` });
        }
        case 4:
            lavagens = lavagens.filter(l => l.user !== user);
            return res.json({ fulfillmentText: `Lavagem finalizada para *${user}*!` });
        case 5:
            fila.push({ user, entryTime: moment().tz("America/Sao_Paulo").toISOString() });
            return res.json({ fulfillmentText: `*${user}*, você entrou na fila! 📋` });
        case 6:
            fila = fila.filter(f => f.user !== user);
            return res.json({ fulfillmentText: `*${user}*, você saiu da fila. 🚶` });
        case 7:
            return res.json({ fulfillmentText: `Aqui está a tabela de pesos das roupas.` });
        case 8:
            return res.json({ fulfillmentText: `O horário de funcionamento é das 7:00 às 22:00.` });
        case 9:
            return res.json({ fulfillmentText: `Previsão do tempo: 🌤️` });
        case 10:
            return res.json({ fulfillmentText: `🚛 Dias de coleta de lixo: Terça, Quinta e Sábado.` });
        default:
            return res.json({ fulfillmentText: 'Opção inválida. Escolha um número do menu.' });
    }
});

app.post('/criar-usuario', async (req, res) => {
    const { telefone, nome } = req.body;
    const response = await criarUsuario(telefone, nome);
    res.json({ fulfillmentText: response });
});

app.post('/excluir-usuario', async (req, res) => {
    const { telefone } = req.body;
    const response = await excluirUsuario(telefone);
    res.json({ fulfillmentText: response });
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
