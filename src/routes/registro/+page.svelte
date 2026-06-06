<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Brand from '$lib/components/Brand.svelte';
	import Field from '$lib/components/Field.svelte';
	import SasInfo from '$lib/components/SasInfo.svelte';
	import { GIROS, RAMOS, nuevoRegistro, validarDueno, validarNegocio } from '$lib/registro';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const PASOS = ['Dueño del negocio', 'Tu negocio'];

	let paso = $state(0);
	let registro = $state(nuevoRegistro());
	let password = $state('');
	let errores = $state<string[]>([]);

	function continuar() {
		errores = validarDueno(registro.dueno);
		if (errores.length === 0) paso = 1;
	}

	function regresar() {
		errores = [];
		paso = 0;
	}
</script>

<svelte:head>
	<title>Registro — NegociaCDMX</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	<header class="border-b border-neutral-200 bg-white">
		<div class="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
			<Brand />
			<a href={resolve('/')} class="text-sm text-neutral-500 hover:text-gob">Inicio</a>
		</div>
	</header>

	<main class="mx-auto max-w-2xl px-6 py-10">
		<!-- Indicador de pasos -->
		<ol class="mb-8 flex items-center gap-4">
			{#each PASOS as etiqueta, i (etiqueta)}
				<li class="flex items-center gap-2">
					<span
						class="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition
							{i <= paso ? 'bg-gob text-white' : 'bg-neutral-200 text-neutral-500'}"
					>
						{i + 1}
					</span>
					<span class="text-sm font-medium {i === paso ? 'text-gob' : 'text-neutral-500'}">
						{etiqueta}
					</span>
				</li>
				{#if i < PASOS.length - 1}
					<li class="h-px flex-1 bg-neutral-200"></li>
				{/if}
			{/each}
		</ol>

		{#if errores.length > 0}
			<div class="mb-6 rounded-lg border border-gob/30 bg-gob-soft px-4 py-3 text-sm text-gob-dark">
				<ul class="list-inside list-disc space-y-1">
					{#each errores as e (e)}<li>{e}</li>{/each}
				</ul>
			</div>
		{/if}

		{#if form?.error}
			<div class="mb-6 rounded-lg border border-gob/30 bg-gob-soft px-4 py-3 text-sm text-gob-dark">
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			use:enhance
			onsubmit={(e) => {
				errores = validarNegocio(registro.negocio);
				if (errores.length > 0) e.preventDefault();
			}}
		>
			<div class="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
				{#if paso === 0}
					<h2 class="mb-1 text-xl font-semibold text-neutral-900">Datos del dueño</h2>
					<p class="mb-6 text-sm text-neutral-500">
						Cuéntanos quién está detrás de la idea de negocio.
					</p>

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="sm:col-span-2">
							<Field label="Nombre" name="nombre" bind:value={registro.dueno.nombre} required />
						</div>
						<Field
							label="Apellido paterno"
							name="apellido_pat"
							bind:value={registro.dueno.apellidoPaterno}
							required
						/>
						<Field
							label="Apellido materno"
							name="apellido_mat"
							bind:value={registro.dueno.apellidoMaterno}
						/>
						<Field
							label="Teléfono"
							name="telefono"
							type="tel"
							bind:value={registro.dueno.telefono}
							maxlength={10}
							placeholder="10 dígitos"
							required
						/>
						<Field
							label="Correo"
							name="correo"
							type="email"
							bind:value={registro.dueno.correo}
							placeholder="correo@ejemplo.com"
							required
						/>
						<div class="sm:col-span-2">
							<Field
								label="Contraseña"
								name="password"
								type="password"
								bind:value={password}
								required
							/>
						</div>
					</div>

					<div class="mt-8 flex justify-end">
						<button
							type="button"
							onclick={continuar}
							class="rounded-lg bg-gob px-6 py-2.5 font-semibold text-white transition hover:bg-gob-dark"
						>
							Continuar
						</button>
					</div>
				{:else}
					<!-- Paso 1 como hidden inputs para que se envíen en el POST -->
					<input type="hidden" name="nombre" value={registro.dueno.nombre} />
					<input type="hidden" name="apellido_pat" value={registro.dueno.apellidoPaterno} />
					<input type="hidden" name="apellido_mat" value={registro.dueno.apellidoMaterno} />
					<input type="hidden" name="telefono" value={registro.dueno.telefono} />
					<input type="hidden" name="correo" value={registro.dueno.correo} />
					<input type="hidden" name="password" value={password} />

					<h2 class="mb-1 text-xl font-semibold text-neutral-900">Datos del negocio</h2>
					<p class="mb-6 text-sm text-neutral-500">Información de la empresa que quieres abrir.</p>

					<div class="grid gap-4">
						<Field
							label="Nombre del negocio"
							name="nombre_negocio"
							bind:value={registro.negocio.nombre}
							required
						/>

						<label
							class="flex items-start gap-3 rounded-lg border border-neutral-300 p-3 transition hover:border-gob"
						>
							<input
								type="checkbox"
								bind:checked={registro.negocio.tieneRazonSocial}
								class="mt-0.5 h-4 w-4 accent-gob"
							/>
							<span class="text-sm">
								<span class="font-medium text-neutral-800">¿Ya cuentas con razón social?</span>
								<span class="block text-neutral-500">
									Marca esta casilla si ya constituiste una figura moral (sociedad).
								</span>
							</span>
						</label>

						{#if registro.negocio.tieneRazonSocial}
							<input type="hidden" name="tiene_razon_social" value="true" />
							<div class="grid gap-4 rounded-lg bg-neutral-50 p-4 sm:grid-cols-2">
								<div class="sm:col-span-2">
									<Field
										label="Razón social"
										name="razon_social"
										bind:value={registro.negocio.razonSocial}
										required
									/>
								</div>
								<Field
									label="RFC"
									name="rfc"
									bind:value={registro.negocio.rfc}
									maxlength={13}
									placeholder="ABC123456XYZ"
									hint="Persona moral (12) o física (13 caracteres)."
									required
								/>
							</div>
						{:else}
							<input type="hidden" name="tiene_razon_social" value="false" />
							<SasInfo />
						{/if}

						<!-- Giro -->
						<div>
							<span class="mb-1 block text-sm font-medium text-neutral-700">
								Giro <span class="text-gob">*</span>
							</span>
							<div class="flex flex-wrap gap-2">
								{#each GIROS as g (g.value)}
									<label
										class="cursor-pointer rounded-lg border px-4 py-2 text-sm transition
											{registro.negocio.giro === g.value
											? 'border-gob bg-gob-soft text-gob-dark'
											: 'border-neutral-300 text-neutral-600 hover:border-gob'}"
									>
										<input
											type="radio"
											name="giro"
											value={g.value}
											bind:group={registro.negocio.giro}
											class="sr-only"
										/>
										{g.label}
									</label>
								{/each}
							</div>
						</div>

						<!-- Ramo -->
						<label class="block">
							<span class="mb-1 block text-sm font-medium text-neutral-700">
								Ramo <span class="text-gob">*</span>
							</span>
							<select
								name="ramo"
								bind:value={registro.negocio.ramo}
								class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-gob focus:ring-2 focus:ring-gob/30"
							>
								<option value="" disabled>Selecciona un ramo</option>
								{#each RAMOS as r (r)}
									<option value={r}>{r}</option>
								{/each}
							</select>
						</label>
					</div>

					<div class="mt-8 flex justify-between">
						<button
							type="button"
							onclick={regresar}
							class="rounded-lg border border-neutral-300 px-6 py-2.5 font-semibold text-neutral-700 transition hover:bg-neutral-100"
						>
							Regresar
						</button>
						<button
							type="submit"
							class="rounded-lg bg-gob px-6 py-2.5 font-semibold text-white transition hover:bg-gob-dark"
						>
							Finalizar registro
						</button>
					</div>
				{/if}
			</div>
		</form>
	</main>
</div>
