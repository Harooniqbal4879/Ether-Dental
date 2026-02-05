import bcrypt from "bcryptjs";
async function main() {
  const hash = await bcrypt.hash("Test123!", 10);
  console.log(hash);
}
main();
