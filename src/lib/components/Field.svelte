<script lang="ts">
	interface Props {
		label: string;
		value: string;
		name?: string;
		type?: string;
		placeholder?: string;
		required?: boolean;
		maxlength?: number;
		hint?: string;
	}

	let {
		label,
		value = $bindable(),
		name,
		type = 'text',
		placeholder = '',
		required = false,
		maxlength,
		hint
	}: Props = $props();
</script>

<label class="block">
	<span class="mb-1 block text-sm font-medium text-neutral-700">
		{label}
		{#if required}<span class="text-gob">*</span>{/if}
	</span>
	<input
		bind:value
		{name}
		{type}
		{placeholder}
		{maxlength}
		class="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none transition focus:border-gob focus:ring-2 focus:ring-gob/30"
	/>
	{#if hint}
		<span class="mt-1 block text-xs text-neutral-500">{hint}</span>
	{/if}
</label>
