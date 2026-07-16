const odbc = require('odbc');
process.env.DB2CODEPAGE = '1208';
const connectionString = "DRIVER={IBM DB2 ODBC DRIVER};DATABASE=SAB;HOSTNAME=10.64.1.11;PORT=50000;PROTOCOL=TCPIP;UID=db2user_ro;PWD=Sup3rs4nt0;";

async function test() {
  let conn;
  try {
    conn = await odbc.connect(connectionString);
    const data = await conn.query(`SELECT IDPRODUTO, IDSUBPRODUTO, CUSTOGERENCIAL FROM DBA.POLITICA_PRECO_PRODUTO WHERE IDPRODUTO = 320180`);
    console.log("POLITICA_PRECO_PRODUTO:");
    console.table(data);
    
    const data2 = await conn.query(`SELECT IDPRODUTO, CUSTO_GERENCIAL FROM DBA.PRODUTO WHERE IDPRODUTO = 320180`);
    console.log("PRODUTO:");
    console.table(data2);
  } catch (err) {
    console.error(err);
  } finally {
    if (conn) await conn.close();
    process.exit();
  }
}
test();
