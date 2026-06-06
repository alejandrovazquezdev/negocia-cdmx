<script lang="ts">
	import { page } from '$app/state';

	let open = $state(false);
	let kind: 'bug' | 'feature' = $state('bug');
	let title = $state('');
	let body = $state('');
	let submitting = $state(false);
	let toast: { type: 'ok' | 'err'; text: string } | null = $state(null);

	let route = $derived(page.url.pathname + page.url.search);

	function toggle() {
		open = !open;
		if (open) {
			title = '';
			body = '';
			kind = 'bug';
		}
	}

	function showToast(type: 'ok' | 'err', text: string) {
		toast = { type, text };
		setTimeout(() => (toast = null), 3500);
	}

	async function submit(e: Event) {
		e.preventDefault();
		if (!title.trim() || submitting) return;
		submitting = true;
		try {
			const res = await fetch('/api/feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ kind, title, body, route })
			});
			if (!res.ok) throw new Error(await res.text());
			open = false;
			showToast('ok', kind === 'bug' ? 'Bug reportado' : 'Idea registrada');
		} catch (err) {
			console.error(err);
			showToast('err', 'No se pudo enviar');
		} finally {
			submitting = false;
		}
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) open = false;
	}
</script>

<svelte:window onkeydown={onKey} />

<button
	type="button"
	onclick={toggle}
	aria-expanded={open}
	aria-label="Reportar bug o sugerir mejora"
	title="Reportar bug o sugerir mejora"
	class="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition hover:-translate-y-0.5 {open
		? 'bg-gob-dark'
		: 'bg-gob hover:bg-gob-dark'}"
>
	{#if open}
		<span aria-hidden="true" class="text-2xl leading-none">×</span>
	{:else}
		<span aria-hidden="true" class="text-lg font-bold">!?</span>
	{/if}
</button>

{#if open}
	<div
		role="dialog"
		aria-label="Reportar"
		class="fixed bottom-20 right-5 z-50 flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-xl"
	>
		<header class="flex items-center justify-between gap-3 text-xs">
			<span class="font-semibold uppercase tracking-wide text-neutral-500">Reportar</span>
			<span class="max-w-[200px] truncate text-gob" title={route}>{route}</span>
		</header>

		<div class="inline-flex self-start overflow-hidden rounded-lg border border-neutral-200">
			<button
				type="button"
				onclick={() => (kind = 'bug')}
				class="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition {kind === 'bug'
					? 'bg-gob text-white'
					: 'text-neutral-500 hover:text-neutral-900'}"
			>
				Bug
			</button>
			<button
				type="button"
				onclick={() => (kind = 'feature')}
				class="border-l border-neutral-200 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition {kind ===
				'feature'
					? 'bg-gob text-white'
					: 'text-neutral-500 hover:text-neutral-900'}"
			>
				Mejora
			</button>
		</div>

		<form onsubmit={submit} class="flex flex-col gap-3">
			<label class="flex flex-col gap-1">
				<span class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Título</span>
				<input
					type="text"
					bind:value={title}
					maxlength="200"
					required
					placeholder={kind === 'bug' ? 'Qué falló' : 'Qué te gustaría'}
					class="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-gob focus:ring-1 focus:ring-gob"
				/>
			</label>

			<label class="flex flex-col gap-1">
				<span class="text-xs font-semibold uppercase tracking-wide text-neutral-500">
					Detalle (opcional)
				</span>
				<textarea
					bind:value={body}
					rows="4"
					maxlength="2000"
					placeholder="Pasos para reproducir, contexto…"
					class="min-h-20 resize-y rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-gob focus:ring-1 focus:ring-gob"
				></textarea>
			</label>

			<div class="flex justify-end gap-2">
				<button
					type="button"
					onclick={() => (open = false)}
					class="rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
				>
					Cancelar
				</button>
				<button
					type="submit"
					disabled={submitting || !title.trim()}
					class="rounded-lg bg-gob px-4 py-2 text-sm font-semibold text-white transition hover:bg-gob-dark disabled:cursor-not-allowed disabled:opacity-50"
				>
					{submitting ? 'Enviando…' : 'Enviar'}
				</button>
			</div>
		</form>
	</div>
{/if}

{#if toast}
	<div
		role="status"
		class="fixed bottom-20 right-5 z-[51] rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg {toast.type ===
		'err'
			? 'bg-gob-dark'
			: 'bg-emerald-600'}"
	>
		{toast.text}
	</div>
{/if}
