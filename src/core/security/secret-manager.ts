import keytar from "keytar";

const SERVICE = "plangraph";

export class SecretManager {
  async store(key: string, value: string): Promise<void> {
    await keytar.setPassword(SERVICE, key, value);
  }

  async get(key: string): Promise<string | null> {
    return keytar.getPassword(SERVICE, key);
  }

  async delete(key: string): Promise<void> {
    await keytar.deletePassword(SERVICE, key);
  }

  async list(): Promise<string[]> {
    const creds = await keytar.findCredentials(SERVICE);
    return creds.map((c) => c.account);
  }
}

export const secretManager = new SecretManager();
