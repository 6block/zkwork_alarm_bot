const axios = require('axios');
const fs = require('fs');
const schedule = require('node-schedule');

// 读取 JSON 数  据
const getData = () => {
    return JSON.parse(fs.readFileSync('data.json', 'utf8'));
};

// 发送消息到 Lark 群组
async function sendMessageToLark(message) {
    try {
        await axios.post('https://open.larksuite.com/open-apis/bot/v2/hook/b2ec3ac3-5341-41c2-83bd-db2780bc11d4', {
            msg_type: 'text',
            content: {
                text: message
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log(`Message sent: ${message}`); // 日志确认
    } catch (error) {
        console.error('Error sending message:', error.response ? error.response.data : error.message);
    }
}

// 请求地址数据并进行处理
async function fetchAddressData(address) {
    try {
        const response = await axios.get(`https://zk.work/api/aleo/miner/${address}/dashboard`);
        // console.log('response.data.data===',response.data.data);
        return response.data.data.current.averageHashRate;
    } catch (error) {
        console.error(`Error fetching data for ${address}:`, error);
        return 0; // 如果请求失败，返回0
    }
}

// 主逻辑函数
async function processAddresses() {
    const data = getData();
    
    for (const entry of data) {
        const { name, address } = entry;
        const numPromises = address.map(fetchAddressData);
        const nums = await Promise.all(numPromises);
        
        const total = nums.reduce((acc, curr) => acc + curr, 0);
        if (total < 500000000) { // 500M
            await sendMessageToLark(`${name} 当前算力：${Math.floor(total / 1000000)}M，绑定地址：\n${address.join('，\n')}`);
        }
    }
}

// 每31分钟执行一次
schedule.scheduleJob('*/31 * * * *', processAddresses);

// 启动时立即执行一次
processAddresses();