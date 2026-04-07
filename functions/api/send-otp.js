// functions/api/send-otp.js
export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let { email } = await request.json();
  email = email.toLowerCase().trim();

  if (!email) {
    return new Response(JSON.stringify({ error: "Email diperlukan" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Generate OTP 6 digit
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 menit

  await env.KV.put(`otp:${email}`, JSON.stringify({ otp, expiresAt }), { expirationTtl: 600 });

  const htmlContent = `
    <h2 style="color:#e11d48;">CINESTREAM</h2>
    <p>Kode OTP login Anda:</p>
    <h1 style="font-size:48px; letter-spacing:8px; color:#e11d48;">${otp}</h1>
    <p>Kode ini berlaku <strong>10 menit</strong>.</p>
    <p>Jangan bagikan kode ini.</p>
  `;

  try {
    // Menggunakan Cloudflare Email Worker style (lebih stabil)
    const sendRequest = new Request("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { 
          email: env.GMAIL_EMAIL || "elitecluboffic@gmail.com", 
          name: "CINESTREAM" 
        },
        subject: `Kode OTP CINESTREAM - ${otp}`,
        content: [{ type: "text/html", value: htmlContent }]
      })
    });

    const response = await fetch(sendRequest);

    if (response.ok) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Kode OTP telah dikirim ke email Anda. Cek inbox/spam." 
      }), { headers: { "Content-Type": "application/json" } });
    } else {
      const errText = await response.text();
      console.error("MailChannels error:", errText);
      throw new Error("Gagal mengirim");
    }
  } catch (err) {
    console.error("Send OTP error:", err);
    return new Response(JSON.stringify({ 
      error: "Gagal mengirim OTP. Coba lagi dalam beberapa detik." 
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
