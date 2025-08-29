// Хранилище активных портов
const ports = new Set()

// Утилита широковещательной отправки
function broadcast(data, exceptPort = null) {
	for (const p of ports) {
		if (p !== exceptPort) {
			p.postMessage(data)
		}
	}
}

// eslint-disable-next-line no-undef
onconnect = (event) => {
	const port = event.ports[0]
	ports.add(port)

	// По желанию можно присвоить вкладке id
	const clientId = Math.random().toString(36).slice(2, 8)

	port.start()
	port.postMessage({ type: 'hello', clientId, count: ports.size })

	broadcast({ type: 'system', text: `✅ Новый клиент подключился (${clientId}). Всего: ${ports.size}` }, port)

	port.onmessage = (e) => {
		const msg = e.data

		// Простая маршрутизация
		switch (msg?.type) {
			case 'chat':
				// Рассылаем остальным вкладкам
				broadcast({ type: 'chat', from: clientId, text: msg.text }, port)
				break

			case 'modal-open':
				// Открываем модальное окно во всех вкладках
				broadcast({ type: 'modal-open' })
				break

			case 'modal-close':
				// Закрываем модальное окно во всех вкладках
				broadcast({ type: 'modal-close' })
				break

			case 'disconnect':
				// Явное отключение (например, beforeunload)
				try { port.close() }
				catch {}
				ports.delete(port)
				broadcast({ type: 'system', text: `👋 Клиент вышел (${clientId}). Осталось: ${ports.size}` })
				break

			default:
				// эхо или игнор
				port.postMessage({ type: 'echo', received: msg })
				break
		}
	}

	port.onmessageerror = () => {
		// На всякий случай — чистим порт, если что-то пошло не так
		ports.delete(port)
	}

	port.onclose = () => {
		ports.delete(port)
		broadcast({ type: 'system', text: `🔻 Соединение закрыто (${clientId}). Осталось: ${ports.size}` })
	}
}
