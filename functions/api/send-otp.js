// functions/api/send-otp.js
export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { email } = await request.json();

  if (!email) {
    return new Response(JSON.stringify({ error: "Email diperlukan" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 menit

  await env.KV.put(`otp:${email}`, JSON.stringify({ otp, expiresAt }), { expirationTtl: 600 });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #e11d48;">CINESTREAM</h2>
      <p>Halo,</p>
      <p>Kode OTP untuk login Anda adalah:</p>
      <h1 style="font-size: 48px; letter-spacing: 12px; color: #e11d48; margin: 30px 0;">${otp}</h1>
      <p>Kode ini berlaku selama <strong>10 menit</strong>.</p>
      <p style="color: #666;">Jangan bagikan kode ini kepada siapa pun.</p>
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #999;">Email ini dikirim otomatis dari CINESTREAM</p>
    </div>
  `;

  try {
    await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: email }] }],
        from: { 
          email: "elitecluboffic@gmail.com", 
          name: "CINESTREAM OTP" 
        },
        subject: `Kode OTP CINESTREAM - ${otp}`,
        content: [{ type: "text/html", value: htmlContent }]
      })
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Kode OTP telah dikirim ke email Anda" 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Gagal mengirim OTP" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
