const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const axios = require('axios');
const { MongoClient, ServerApiVersion } = require('mongodb'); // Usando MongoClient
require('dotenv').config(); // Para ler as variáveis de ambiente

const app = express();
app.use(bodyParser.json());

const hgBrasilAPIKey = 'c657e670';

let fila = [];
let lavagens = [];

// Substituir a variável de ambiente pela URI diretamente
const uri = "mongodb+srv://jkuniversitario421:<M@iden25654545>@cluster0.jz5ul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Substitua <db_password> pela sua senha real
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Função para criar usuário
async function criarUsuario(telefone, nome) {
    try {
        await client.connect();
        const db = client.db("botdb");
        const usuariosCollection = db.collection('usuarios');
        const usuarioExistente = await usuariosCollection.findOne({ telefone });

        if (usuarioExistente) {
            return 'Usuário já existe!';
        }

        // Inserir o novo usuário
        await usuariosCollection.insertOne({ telefone, nome });
        return `Usuário ${nome} criado com sucesso!`;
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return 'Erro ao criar usuário!';
    }
}

// Função para buscar o nome do usuário pelo telefone
async function buscarUsuarioPorTelefone(telefone) {
    try {
        await client.connect();
        const db = client.db("botdb");
        const usuariosCollection = db.collection('usuarios');
        const usuario = await usuariosCollection.findOne({ telefone });
        return usuario ? usuario.nome : 'Usuário';
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return 'Usuário'; // Retorna 'Usuário' caso ocorra erro
    }
}

// Função para excluir usuário
async function excluirUsuario(telefone) {
    try {
        await client.connect();
        const db = client.db("botdb");
        const usuariosCollection = db.collection('usuarios');
        const result = await usuariosCollection.deleteOne({ telefone });

        if (result.deletedCount === 1) {
            return `Usuário com telefone ${telefone} excluído com sucesso.`;
        } else {
            return `Usuário com telefone ${telefone} não encontrado.`;
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        return 'Erro ao excluir usuário!';
    }
}

// Configuração do menu de opções
const menuOptions = `
Escolha uma das opções abaixo:
1️⃣ Para saber como usar 🤷‍♀️🤷‍♂️
2️⃣ Informações técnicas 🧰
3️⃣ Iniciar lavagem 🔛
4️⃣ Finalizar lavagem 🔚
5️⃣ Entrar na fila de lavagem 🚶🚶🚶
6️⃣ Desistir da fila de lavagem 🚶🚶
7️⃣ Tabela de peso das roupas 👖🩲👗👕👚
8️⃣ Horário de funcionamento 🕒🕗🕤
9️⃣ Previsão do tempo ⛈️☀️🌤️🌨️
🔟 Dias de coleta de lixo ♻️
`;

// Rota do webhook
app.post('/webhook', async (req, res) => {
    console.log('Recebido:', JSON.stringify(req.body, null, 2));

    const intentName = req.body.queryResult.intent.displayName;
    const option = Number(req.body.queryResult.queryText);
    const telefone = req.body.originalDetectIntentRequest.payload.data?.from || ''; 

    // Buscar nome do usuário no banco de dados
    const user = await buscarUsuarioPorTelefone(telefone);

    if (intentName === 'Mostrar Menu') {
        return res.json({ fulfillmentText: menuOptions });
    }

    switch (option) {
        case 1: {
            res.json({
                fulfillmentText: `Siga as dicas para uma boa utilização pelo link:\nhttps://youtu.be/2O_PWz-0qic`
            });
            break;
        }
        case 2: {
            res.json({
                fulfillmentText: `
                    🔧🛠️🔩🧰🔧🛠️🔩🧰
                    INFORMAÇÕES TÉCNICAS
                    - Lavadora de Roupas Electrolux
                    - Capacidade: *8,5Kg*
                    - Modelo: LT09E Top Load Turbo Agitação Super
                    - Programas de Lavagem: 9
                    - Níveis de Água: 4
                    - Cor: Branca

                    CARACTERÍSTICAS
                    - Capacidade *(kg de roupas)*: *8,5Kg*
                    - Acesso ao cesto: *Superior*
                    - Água quente: *Não*
                    - Enxágues: *1*    
                    - Centrifugação: *Sim* 
                    - Dispenser para sabão: *Sim*
                    - Dispenser para amaciante: *Sim*
                    - Dispenser para alvejante: *Sim*
                    - Elimina fiapos: *Sim - através do filtro*
                    - Níveis de água: *Extra, Baixo, Médio, Alto*

                    ESPECIFICAÇÕES TÉCNICAS
                    - Consumo: (kWh) *0,25kWh/ciclo*
                    - Controles: *Eletromecânicos*  
                    - Velocidade de centrifugação: *(rpm)* *660*
                    - Tensão/Voltagem: *220V* 
                    - Acabamento do cesto: *Polipropileno*
                    - Consumo de Energia: *A (menos 25% de consumo)*
                    - Consumo de água: *112 litros por ciclo*
                    - Eficiência Energética: *A*

                    Uma boa lavagem! 🔧🛠️🔩🧰🔧🛠️🔩🧰 `
            });
            break;

        }
        case 3: {
            const currentTime = moment().tz("America/Sao_Paulo");
            const endTime = currentTime.clone().add(2, 'hours');
            lavagens.push({ user, startTime: currentTime.toISOString(), endTime: endTime.toISOString() });

            setTimeout(() => {
                console.log(`🔔 Notificação: 5 minutos restantes para ${user}`);
            }, 115 * 60 * 1000); 

            res.json({
                fulfillmentText: `Lavagem iniciada para *${user}*! ⏳\nHora de início: *${currentTime.format('HH:mm:ss')}*\n Programada para terminar às: *${endTime.format('HH:mm:ss')}* 🕑`
            });
            break;
        }
        case 4: {
            const currentTime = moment().tz("America/Sao_Paulo");
            const lavagem = lavagens.find(l => l.user === user);
            if (lavagem) {
                const duration = currentTime.diff(moment(lavagem.startTime), 'minutes');
                lavagens = lavagens.filter(l => l.user !== user);
                let aviso = duration > 120 ? `⚠️ Atenção! Sua lavagem ultrapassou o tempo recomendado de 2 horas. Lembre-se de respeitar o tempo para melhor eficiência` : `🎉 Parabéns! Você seguiu o tempo recomendado de lavagem. Obrigado por sua colaboração`;
                res.json({
                    fulfillmentText: `Lavagem finalizada! 🏁\nDuração: *${duration} minutos*\n${aviso}`
                });
            } else {
                res.json({
                    fulfillmentText: `Você saiu da fila de lavagem às *${currentTime.format('HH:mm:ss')}*.` // Incluindo os segundos
                });
            }
            break; // O break estava fora do escopo do `case 4`, agora está dentro
        }
        case 5: {
            fila.push({ user, entryTime: moment().tz("America/Sao_Paulo").toISOString() });
            let position = fila.findIndex(f => f.user === user) + 1;
            let waitingTime = lavagens.length > 0 ? moment(lavagens[0].endTime).tz("America/Sao_Paulo").diff(moment(), 'minutes') : 0;
            res.json({
                fulfillmentText: `*${user}*, você entrou na fila! 📋\nPosição na fila: *${position}*️⃣\nTempo estimado: *${waitingTime} minutos* ⏳`
            });
            break;
        }
        case 6: {
            fila = fila.filter(f => f.user !== user);
            res.json({ fulfillmentText: `*${user}*, você saiu da fila. 🚶` });
            break;
        }

        case 7: {
            const items = [
                // ... seu código de itens
            ];

            const MAX_WEIGHT = 6000; // Limite de peso em gramas
            const MAX_COMBINATIONS = 7;

            function calculateTotalWeight(combination) {
                return combination.reduce((total, currentItem) => total + currentItem.weight, 0);
            }

            function getRandomCombination(items, weightLimit) {
                let combination = [];
                let totalWeight = 0;

                let shuffledItems = items.sort(() => 0.5 - Math.random());
                for (const item of shuffledItems) {
                    if (totalWeight + item.weight <= weightLimit) {
                        combination.push(item);
                        totalWeight += item.weight;
                    }
                    if (totalWeight >= weightLimit) break;
                }
                return combination;
            }

            let randomCombinations = [];
            while (randomCombinations.length < MAX_COMBINATIONS) {
                let combination = getRandomCombination(items, MAX_WEIGHT);
                if (combination.length > 0) {
                    randomCombinations.push(combination);
                }
            }

            res.json({
                fulfillmentText: `Aqui estão as combinações sugeridas para as roupas com o limite de peso de ${MAX_WEIGHT}g:\n\n` + randomCombinations.map((combo, idx) => {
                    return `Opção ${idx + 1}: ${combo.map(item => item.item).join(', ')} (Peso total: ${calculateTotalWeight(combo)}g)`;
                }).join("\n")
            });

            break;
        }

        case 8: {
            const currentTime = moment().tz("America/Sao_Paulo");
            const closingTime = currentTime.clone().set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
            const latestStartTime = closingTime.clone().subtract(2, 'hours');
            if (currentTime.isBefore(latestStartTime)) {
                res.json({
                    fulfillmentText: `O horário de funcionamento da lavanderia é das 7:00 às 22:00. Iniciando uma lavagem agora, você deve terminar até as ${closingTime.format('HH:mm')}.`
                });
            } else {
                res.json({
                    fulfillmentText: 'A lavanderia está fechada agora. O horário de funcionamento é das 7:00 às 22:00.'
                });
            }
            break;
        }

        case 9: {
            // Previsão do tempo
            break;
        }

        case 10:
            res.json({
                fulfillmentText: `🚛 **Dias de Coleta de Lixo** 🚛\n\n🗑️ *Dias*: Terça, Quinta e Sábado\n\n♻️ Vamos cuidar do meio ambiente! Separe o seu lixo corretamente. ♻️`
            });
            break;

        default:
            res.json({ fulfillmentText: 'Opção inválida. Escolha um número do menu.' });
    }
});

// Rota para criar usuário
app.post('/criar-usuario', async (req, res) => {
    const { telefone, nome } = req.body;
    const response = await criarUsuario(telefone, nome);
    res.json({ fulfillmentText: response });
});

// Rota para excluir usuário
app.post('/excluir-usuario', async (req, res) => {
    const { telefone } = req.body;
    const response = await excluirUsuario(telefone);
    res.json({ fulfillmentText: response });
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
