// functions/api/send-otp.js
export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { email } = await request.json();

  if (!email || email !== "elitecluboffic@gmail.com" && !email.includes("@")) {
    return new Response(JSON.stringify({ error: "Email tidak valid" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Generate OTP 6 digit
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 menit

  // Simpan OTP di KV
  await env.KV.put(`otp:${email}`, JSON.stringify({ otp, expiresAt }), { expirationTtl: 600 });

  // Kirim OTP via Gmail SMTP (menggunakan fetch + socket simulation - ini versi sederhana)
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e11d48;">CINESTREAM</h2>
      <p>Kode OTP untuk login Anda adalah:</p>
      <h1 style="font-size: 42px; letter-spacing: 10px; color: #e11d48; margin: 20px 0;">${otp}</h1>
      <p>Kode ini berlaku selama <strong>10 menit</strong>.</p>
      <p>Jangan bagikan kode ini kepada siapa pun.</p>
      <hr>
      <p style="font-size: 12px; color: #666;">Email ini dikirim dari CINESTREAM</p>
    </div>
  `;

  try {
    const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: env.GMAIL_EMAIL || "elitecluboffic@gmail.com", name: "CINESTREAM" },
        subject: `Kode OTP CINESTREAM - ${otp}`,
        content: [{
          type: "text/html",
          value: htmlContent
        }]
      })
    });

    if (!response.ok) throw new Error("Gagal mengirim email");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "OTP telah dikirim ke email Anda" 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Email send error:", error);
    return new Response(JSON.stringify({ error: "Gagal mengirim OTP. Silakan coba lagi." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
