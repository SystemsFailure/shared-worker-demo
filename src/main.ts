import './style.css'
import typescriptLogo from './typescript.svg'

import viteLogo from '/vite.svg'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
	<div>
		<img src="${viteLogo}" class="logo" alt="Vite logo" />
		<img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />

		<h1>Vite + TypeScript</h1>
	</div>
`

// Инициализация shared worker
let port: any
(function initSharedWorker() {
	const worker = new SharedWorker('shared-worker.js')
	port = worker.port
	port.start()

	// UI-хуки (ищем элементы, если они есть на странице)
	const $log = document.getElementById('log')!
	const $form = document.getElementById('form')!
	const $input = document.getElementById('input')!

	function log(line: string) {
		if ($log) {
			const li = document.createElement('li')
			li.textContent = line
			$log.appendChild(li)
		}
		else {
			console.log(line)
		}
	}

	// Приём сообщений от воркера
	port.onmessage = (e: any) => {
		const msg = e.data
		switch (msg?.type) {
			case 'hello':
				log(`🧵 Подключено. Ваш clientId: ${msg.clientId}. Клиентов: ${msg.count}`)
				break
			case 'system':
				log(msg.text)
				break
			case 'chat':
				log(`💬 [${msg.from}]: ${msg.text}`)
				break
			case 'echo':
				log(`↩️ echo: ${JSON.stringify(msg.received)}`)
				break
			default:
				log(`(unknown) ${JSON.stringify(msg)}`)
		}
	}

	port.onmessageerror = () => log('⚠️ messageerror')
	port.onerror = (err: any) => log(`⚠️ error: ${err?.message || err}`)

	// Отправка сообщений (если есть форма)
	if ($form && $input) {
		$form.addEventListener('submit', (e: any) => {
			e.preventDefault()
			// eslint-disable-next-line ts/ban-ts-comment
			// @ts-expect-error
			const text = $input.value.trim()
			if (text) {
				port.postMessage({ type: 'chat', text })
				// eslint-disable-next-line ts/ban-ts-comment
				// @ts-expect-error
				$input.value = ''
				$input.focus()
			}
		})
	}

	// Чистое отключение при закрытии/перезагрузке вкладки
	window.addEventListener('beforeunload', () => {
		try {
			port.postMessage({ type: 'disconnect' })
			port.close()
		}
		catch {}
	})
})()
