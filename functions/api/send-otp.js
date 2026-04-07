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
    <h2 style="color:#e11d48;">CINESTREAM</h2>
    <p>Kode OTP untuk login Anda:</p>
    <h1 style="font-size:48px; letter-spacing:12px; color:#e11d48;">${otp}</h1>
    <p>Kode ini berlaku selama <strong>10 menit</strong>.</p>
    <p>Jangan bagikan kode ini kepada siapa pun.</p>
  `;

  try {
    await env.SEND_EMAIL.send({
      from: { 
        email: "noreply@cinestream.pages.dev", 
        name: "CINESTREAM" 
      },
      to: [{ email: email }],
      subject: `Kode OTP CINESTREAM - ${otp}`,
      content: [{ 
        type: "text/html", 
        value: htmlContent 
      }]
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Kode OTP telah dikirim ke email Anda. Cek inbox atau spam." 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Send email error:", err);
    return new Response(JSON.stringify({ 
      error: "Gagal mengirim OTP. Coba lagi dalam 10 detik." 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
