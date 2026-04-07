// functions/api/login.js
export async function onRequest({ request, env }) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { email, otp } = await request.json();

  if (!email || !otp) {
    return new Response(JSON.stringify({ error: "Email dan OTP wajib diisi" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  const otpDataStr = await env.KV.get(`otp:${email}`);
  if (!otpDataStr) {
    return new Response(JSON.stringify({ error: "OTP tidak ditemukan atau kadaluarsa" }), { 
      status: 401, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  const otpData = JSON.parse(otpDataStr);

  if (otpData.otp !== otp || Date.now() > otpData.expiresAt) {
    return new Response(JSON.stringify({ error: "OTP salah atau sudah kadaluarsa" }), { 
      status: 401, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  // Ambil atau buat user
  let user = await env.KV.get(`user:${email}`, "json");
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      email,
      role: email === "elitecluboffic@gmail.com" ? "admin" : "user",
      createdAt: Date.now()
    };
    await env.KV.put(`user:${email}`, JSON.stringify(user));
  }

  // Buat session
  const token = crypto.randomUUID();
  await env.KV.put(`session:${token}`, email, { expirationTtl: 7 * 86400 }); // 7 hari

  // Hapus OTP
  await env.KV.delete(`otp:${email}`);

  return new Response(JSON.stringify({
    success: true,
    token,
    user: { id: user.id, email: user.email, role: user.role }
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
