import 'dotenv/config';
import app from './app.js';
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1-65535');
app.listen(port, () => console.log('SlotDrop CP0: http://localhost:' + port));
