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

  // === TAMBAHAN: CEK COOLDOWN ===
  const cooldownKey = `cooldown:${email}`;
  const cooldown = await env.KV.get(cooldownKey);

  if (cooldown) {
    const { expiresAt } = JSON.parse(cooldown);
    const remaining = Math.ceil((expiresAt - Date.now()) / 1000);

    if (remaining > 0) {
      return new Response(JSON.stringify({
        error: "Tunggu sebentar sebelum kirim OTP lagi",
        cooldown: remaining
      }), {
        status: 429,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  await env.KV.put(`otp:${email}`, JSON.stringify({ otp, expiresAt }), {
    expirationTtl: 600
  });

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
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "User-Agent": "CineStream/1.0"
      },
      body: JSON.stringify({
        from: "CINESTREAM <no-reply@cinestream.kraxx.my.id>",
        to: [email],
        subject: `Kode OTP CINESTREAM - ${otp}`,
        html: htmlContent
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend Error:", res.status, errText);
     
      let errorMsg = "Gagal mengirim OTP";
      if (res.status === 403) {
        errorMsg = "Domain belum diverifikasi di Resend";
      } else if (res.status === 422) {
        errorMsg = "Format email pengirim tidak valid";
      }
      throw new Error(errText);
    }

    // === SET COOLDOWN setelah berhasil kirim ===
    const cooldownExpiresAt = Date.now() + 60 * 1000; // 60 detik
    await env.KV.put(cooldownKey, JSON.stringify({ expiresAt: cooldownExpiresAt }), {
      expirationTtl: 60
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Kode OTP telah dikirim ke email Anda. Cek inbox/spam."
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Send OTP Error:", err);
    return new Response(JSON.stringify({
      error: "Gagal mengirim OTP. Coba lagi dalam beberapa detik."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
