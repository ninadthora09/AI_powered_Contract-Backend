import Bytez from "bytez.js";
import dotenv from "dotenv";
dotenv.config();

const sdk = new Bytez(process.env.BYTEZ_API_KEY);

const model = sdk.model("openai-community/gpt2");

const runTest = async () => {
  const { error, output } = await model.run("Hello world");
  console.log({ error, output });
};

runTest();
