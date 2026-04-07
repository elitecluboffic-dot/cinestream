// functions/api/register.js
export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const form = await request.formData();
  const email = form.get("email")?.toLowerCase().trim();

  if (!email || !email.includes("@")) {
    return new Response(JSON.stringify({ error: "Email tidak valid" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Cek apakah email sudah terdaftar
  const existingUser = await env.KV.get(`user:${email}`, "json");
  if (existingUser) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email sudah terdaftar. Silakan login dengan OTP." 
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Buat user baru
  const user = {
    id: crypto.randomUUID(),
    email,
    role: email.includes("admin") || email === "elitecluboffic@gmail.com" ? "admin" : "user",
    createdAt: Date.now()
  };

  await env.KV.put(`user:${email}`, JSON.stringify(user));

  return new Response(JSON.stringify({ 
    success: true, 
    message: "Registrasi berhasil! Silakan login dengan OTP." 
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
