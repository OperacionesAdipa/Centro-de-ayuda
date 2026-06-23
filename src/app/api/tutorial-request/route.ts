import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, description, country } = await req.json()

    if (!name || !email || !description) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }

    const res = await fetch('https://hook.us2.make.com/89bcr9zw0ncth1ac3e3eke9rvbmjnuyq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: name,
        correo: email,
        descripcion: description,
        pais: country,
        fecha: new Date().toISOString(),
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Error al enviar a Make' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
