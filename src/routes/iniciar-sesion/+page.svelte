<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import Field from '$lib/components/Field.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let correo = $state('');
	let password = $state('');
</script>

<svelte:head>
	<title>Iniciar sesión — NegociaCDMX</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-neutral-50">
	<SiteHeader maxWidth="2xl">
		<a href={resolve('/')} class="text-sm text-neutral-500 hover:text-gob">Inicio</a>
	</SiteHeader>

	<div class="flex flex-1 items-center justify-center px-6 py-10">
		<form
			method="POST"
			use:enhance
			class="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8"
		>
			<h1 class="mb-1 text-xl font-semibold text-neutral-900">Iniciar sesión</h1>
			<p class="mb-6 text-sm text-neutral-500">Accede a tu panel de emprendimiento.</p>

			{#if form?.error}
				<div
					role="alert"
					aria-live="polite"
					class="mb-4 rounded-lg border border-gob/30 bg-gob-soft px-4 py-3 text-sm text-gob-dark"
				>
					{form.error}
				</div>
			{/if}

			<div class="grid gap-4">
				<Field
					label="Correo"
					name="correo"
					type="email"
					bind:value={correo}
					placeholder="correo@ejemplo.com"
					autocomplete="email"
					inputmode="email"
					required
				/>
				<Field
					label="Contraseña"
					name="password"
					type="password"
					bind:value={password}
					autocomplete="current-password"
					required
				/>
				<button
					type="submit"
					class="mt-2 rounded-lg bg-gob px-6 py-2.5 font-semibold text-white transition hover:bg-gob-dark"
				>
					Entrar
				</button>
			</div>

			<p class="mt-6 text-center text-sm text-neutral-500">
				¿No tienes cuenta?
				<a href={resolve('/registro')} class="font-medium text-gob hover:underline"> Regístrate </a>
			</p>
		</form>
	</div>
</div>
