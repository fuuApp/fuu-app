/**
 * fuu ふぅ — AES-256-GCM 暗号化ユーティリティ（Web Crypto API）
 *
 * 用途：
 *   - 将来DBにメッセージを保存する際の暗号化
 *   - guchi_journalsの内容暗号化
 *
 * 暗号化キーは Vercel 環境変数 ENCRYPTION_KEY に設定（32バイト・hex形式）
 *
 * 生成方法（ターミナルで実行）:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * ⚠️ このキーを紛失すると暗号化済みデータが永久に読めなくなる。
 *    GitHubには絶対にコミットしない。Vercel環境変数＋安全な場所にバックアップ。
 */

const IV_LENGTH = 12  // AES-GCM推奨: 96bit

/** hex文字列 → ArrayBuffer（Uint8Array<ArrayBuffer>型保証） */
function hexToArrayBuffer(hex: string): ArrayBuffer {
  const ab = new ArrayBuffer(hex.length / 2)
  const view = new Uint8Array(ab)
  for (let i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return ab
}

/** Uint8Array → base64文字列 */
function toBase64(ab: ArrayBuffer): string {
  return Buffer.from(ab).toString('base64')
}

/** base64文字列 → ArrayBuffer */
function fromBase64(base64: string): ArrayBuffer {
  const buf = Buffer.from(base64, 'base64')
  const ab = new ArrayBuffer(buf.length)
  new Uint8Array(ab).set(buf)
  return ab
}

async function getKey(): Promise<CryptoKey | null> {
  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex) return null

  const keyBuffer = hexToArrayBuffer(keyHex)
  if (keyBuffer.byteLength !== 32) {
    throw new Error('ENCRYPTION_KEY は32バイト（64文字のhex）である必要があります')
  }

  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * テキストを暗号化する
 * @returns "iv:ciphertext" 形式のbase64文字列
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey()
  if (!key) return plaintext  // キー未設定時はそのまま返す

  const ivBuffer = new ArrayBuffer(IV_LENGTH)
  crypto.getRandomValues(new Uint8Array(ivBuffer))

  const rawEncoded = new TextEncoder().encode(plaintext)
  const encodedBuffer = new ArrayBuffer(rawEncoded.length)
  new Uint8Array(encodedBuffer).set(rawEncoded)

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    encodedBuffer
  )

  return [toBase64(ivBuffer), toBase64(encrypted)].join(':')
}

/**
 * 暗号化されたテキストを復号する
 * @param ciphertext "iv:ciphertext" 形式のbase64文字列
 */
export async function decrypt(ciphertext: string): Promise<string> {
  if (!ciphertext.includes(':')) return ciphertext

  const key = await getKey()
  if (!key) return ciphertext

  const parts = ciphertext.split(':')
  if (parts.length !== 2) return ciphertext

  const [ivBase64, dataBase64] = parts
  const ivBuffer = fromBase64(ivBase64)
  const dataBuffer = fromBase64(dataBase64)

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      key,
      dataBuffer
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    console.error('Decryption failed')
    return ciphertext
  }
}

/** 暗号化済みかどうかを判定（移行期の後方互換用） */
export function isEncrypted(text: string): boolean {
  return text.split(':').length === 2
}
