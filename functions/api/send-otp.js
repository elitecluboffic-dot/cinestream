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

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  await env.KV.put(`otp:${email}`, JSON.stringify({ otp, expiresAt }), { expirationTtl: 600 });

  const htmlContent = `
    <h2 style="color:#e11d48;">CINESTREAM</h2>
    <p>Kode OTP login Anda adalah:</p>
    <h1 style="font-size:48px; letter-spacing:12px; color:#e11d48;">${otp}</h1>
    <p>Kode ini berlaku selama <strong>10 menit</strong>.</p>
    <p>Jangan bagikan kode ini kepada siapa pun.</p>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "CINESTREAM <onboarding@resend.dev>",   // kamu bisa ganti domain nanti
        to: [email],
        subject: `Kode OTP CINESTREAM - ${otp}`,
        html: htmlContent
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      throw new Error("Gagal");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Kode OTP telah dikirim ke email Anda. Cek inbox/spam." 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ 
      error: "Gagal mengirim OTP. Coba lagi dalam beberapa detik." 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
