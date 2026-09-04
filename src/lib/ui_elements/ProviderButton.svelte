<script>
    export let provider;
    export let disabled = false;
    export let compact = false;
</script>

<button
    class="provider_button"
    class:is_compact={compact}
    {disabled}
    on:click
    aria-label={'Continue with ' + provider.label}
>
    <span class="provider_icon" style="color: {provider.brand_color};">{@html provider.icon}</span>
    <span class="provider_label">{provider.label}</span>
    {#if !compact}
        <span class="provider_chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </span>
    {/if}
</button>

<style>
    .provider_button {
        display: flex;
        align-items: center;
        gap: var(--spacing_lg);
        width: 100%;
        padding: 13px 16px;
        background: var(--bg_surface_2);
        border: 1px solid var(--border_primary);
        border-radius: var(--radius_md);
        color: var(--text_primary);
        font-size: var(--font_size_md);
        font-weight: var(--font_weight_medium);
        cursor: pointer;
        transition: background var(--transition_base), border-color var(--transition_base),
            transform var(--transition_base);
    }
    .provider_button:hover:not(:disabled) {
        background: var(--bg_surface_3);
        border-color: var(--border_strong);
    }
    .provider_button:active:not(:disabled) {
        transform: translateY(1px);
    }
    .provider_button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .provider_button.is_compact {
        justify-content: center;
        gap: var(--spacing_md);
        padding: 12px 14px;
    }
    .provider_icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        flex-shrink: 0;
    }
    .provider_icon :global(svg) {
        display: block;
    }
    .provider_label {
        flex: 1;
        text-align: left;
    }
    .is_compact .provider_label {
        flex: initial;
        text-align: center;
    }
    .provider_chevron {
        color: var(--text_tertiary);
        display: inline-flex;
    }
</style>
