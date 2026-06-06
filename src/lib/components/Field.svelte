<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props {
		/** Etiqueta visible del campo. */
		label: string;
		/** Valor bindable (two-way binding con el padre). */
		value: string;
		type?: HTMLInputAttributes['type'];
		/** Nombre del input. Útil para autofill, validación HTML5 y SSR. */
		name?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		readonly?: boolean;
		maxlength?: number;
		minlength?: number;
		pattern?: string;
		inputmode?: 'text' | 'tel' | 'email' | 'numeric' | 'url' | 'search' | 'none';
		autocomplete?: HTMLInputAttributes['autocomplete'];
		/** Texto de ayuda. Se asocia al input con `aria-describedby`. */
		hint?: string;
		/** Mensaje de error. Si se pasa, marca el input con `aria-invalid="true"`. */
		error?: string;
		/** Override del `id` auto-generado. Útil cuando hay varios Fields con la misma label. */
		id?: string;
		/** Handler para cuando el input pierde el foco. */
		onblur?: (e: FocusEvent) => void;
		/** Muestra botón para alternar visibilidad (solo cuando type="password"). */
		togglePassword?: boolean;
	}

	let {
		label,
		value = $bindable(),
		type = 'text',
		name,
		placeholder = '',
		required = false,
		disabled = false,
		readonly = false,
		maxlength,
		minlength,
		pattern,
		inputmode,
		autocomplete,
		hint,
		error,
		id,
		onblur,
		togglePassword = false
	}: Props = $props();

	let showPassword = $state(false);
	const effectiveType = $derived(
		togglePassword && type === 'password' ? (showPassword ? 'text' : 'password') : type
	);

	// Auto-id determinista, seguro para SSR/hidratación.
	const autoId = $derived(
		id ??
			`field-${label
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '')}`
	);
	const hintId = $derived(`${autoId}-hint`);
	const errorId = $derived(`${autoId}-error`);
	const describedBy = $derived(
		[hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
	);
	const errorAttr = $derived(error ? 'true' : undefined);
	const requiredAttr = $derived(required ? 'true' : undefined);
</script>

<div>
	<label for={autoId} class="mb-1 block text-sm font-medium text-neutral-700">
		{label}
		{#if required}<span class="text-gob" aria-hidden="true">*</span>{/if}
	</label>
	<div class="relative">
		<input
			id={autoId}
			{name}
			type={effectiveType}
			{placeholder}
			{required}
			{disabled}
			{readonly}
			{maxlength}
			{minlength}
			{pattern}
			{inputmode}
			{autocomplete}
			bind:value
			{onblur}
			aria-invalid={errorAttr}
			aria-describedby={describedBy}
			aria-required={requiredAttr}
			class="w-full rounded-lg border bg-white px-3 py-2 text-neutral-900 transition outline-none
				focus:ring-2 focus:ring-gob/30 focus:ring-offset-2 focus:ring-offset-white
				{togglePassword ? 'pr-10' : ''}
				{error ? 'border-gob focus:border-gob' : 'border-neutral-300 focus:border-gob'}
				disabled:cursor-not-allowed disabled:bg-neutral-100"
		/>
		{#if togglePassword && type === 'password'}
			<button
				type="button"
				onclick={() => (showPassword = !showPassword)}
				aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
				class="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 hover:text-neutral-700 focus:outline-none"
			>
				{#if showPassword}
					<!-- ojo tachado: ocultar -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="h-5 w-5"
						aria-hidden="true"
					>
						<path
							d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
						/>
						<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
						<line x1="1" y1="1" x2="23" y2="23" />
					</svg>
				{:else}
					<!-- ojo abierto: mostrar -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="h-5 w-5"
						aria-hidden="true"
					>
						<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
						<circle cx="12" cy="12" r="3" />
					</svg>
				{/if}
			</button>
		{/if}
	</div>
	{#if hint && !error}
		<span id={hintId} class="mt-1 block text-xs text-neutral-500">
			{hint}
		</span>
	{/if}
	{#if error}
		<span id={errorId} role="alert" class="mt-1 block text-xs font-medium text-gob-dark">
			{error}
		</span>
	{/if}
</div>
