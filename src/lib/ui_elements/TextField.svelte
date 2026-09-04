<script>
    export let label = '';
    export let type = 'text';
    export let value = '';
    export let name = '';
    export let placeholder = '';
    export let autocomplete = 'off';
    export let error = '';
    export let required = false;
    export let id = 'field_' + Math.random().toString(36).slice(2, 9);
</script>

<div class="form_field" class:has_error={error}>
    {#if label}
        <label class="field_label" for={id}>{label}</label>
    {/if}
    <input
        {id}
        {name}
        {type}
        {placeholder}
        {autocomplete}
        {required}
        class="field_input"
        value={value}
        on:input={(event) => (value = event.currentTarget.value)}
        on:keydown
    />
    {#if error}
        <span class="field_error">{error}</span>
    {/if}
</div>

<style>
    .form_field {
        display: flex;
        flex-direction: column;
        gap: var(--spacing_md);
    }
    .field_label {
        font-size: var(--font_size_xs);
        font-weight: var(--font_weight_semibold);
        letter-spacing: var(--eyebrow_spacing);
        text-transform: uppercase;
        color: var(--text_tertiary);
    }
    .field_input {
        width: 100%;
        padding: 12px 14px;
        background: var(--bg_surface_2);
        border: 1px solid var(--border_primary);
        border-radius: var(--radius_md);
        color: var(--text_primary);
        font-size: var(--font_size_md);
        transition: border-color var(--transition_base), box-shadow var(--transition_base);
    }
    .field_input::placeholder {
        color: var(--text_tertiary);
    }
    .field_input:focus {
        outline: none;
        border-color: var(--accent_primary_border);
        box-shadow: 0 0 0 3px var(--accent_primary_soft);
    }
    .has_error .field_input {
        border-color: var(--color_negative_border);
    }
    .field_error {
        font-size: var(--font_size_sm);
        color: var(--color_negative);
    }
</style>
