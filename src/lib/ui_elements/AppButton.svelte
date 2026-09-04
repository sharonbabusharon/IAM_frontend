<script>
    export let variant = 'primary'; // primary, secondary, ghost, danger
    export let type = 'button';
    export let block = false;
    export let loading = false;
    export let disabled = false;
</script>

<button
    {type}
    class="app_button app_button_{variant}"
    class:block
    disabled={disabled || loading}
    on:click
>
    {#if loading}
        <span class="button_spinner" aria-hidden="true"></span>
    {/if}
    <span class="button_label"><slot /></span>
</button>

<style>
    .app_button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing_md);
        padding: 12px 20px;
        border-radius: var(--radius_pill);
        font-family: var(--font_family);
        font-size: var(--font_size_md);
        font-weight: var(--font_weight_semibold);
        line-height: 1;
        white-space: nowrap;
        cursor: pointer;
        transition: transform var(--transition_base), background var(--transition_base),
            border-color var(--transition_base), filter var(--transition_base), opacity var(--transition_base);
    }
    .app_button.block {
        width: 100%;
    }
    .app_button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .app_button:not(:disabled):active {
        transform: translateY(1px);
    }

    .app_button_primary {
        background: var(--grad_accent);
        color: var(--text_on_accent);
        box-shadow: var(--shadow_glow);
    }
    .app_button_primary:not(:disabled):hover {
        filter: brightness(1.06);
    }

    .app_button_secondary {
        background: var(--bg_surface_2);
        color: var(--text_primary);
        border: 1px solid var(--border_strong);
    }
    .app_button_secondary:not(:disabled):hover {
        background: var(--bg_surface_3);
    }

    .app_button_ghost {
        background: transparent;
        color: var(--text_secondary);
        border: 1px solid var(--border_primary);
    }
    .app_button_ghost:not(:disabled):hover {
        color: var(--text_primary);
        border-color: var(--border_strong);
    }

    .app_button_danger {
        background: var(--color_negative_soft);
        color: var(--color_negative);
        border: 1px solid var(--color_negative_border);
    }
    .app_button_danger:not(:disabled):hover {
        background: rgba(242, 85, 122, 0.2);
    }

    .button_spinner {
        width: 15px;
        height: 15px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.25);
        border-top-color: currentColor;
        animation: button_spin 0.7s linear infinite;
    }
    .app_button_primary .button_spinner {
        border-color: rgba(0, 0, 0, 0.25);
        border-top-color: currentColor;
    }

    @keyframes button_spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
