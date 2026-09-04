<script>
    export let show = false;
    export let label = '';
</script>

<div class="loading_overlay" class:is_hidden={!show}>
    <div class="loading_spinner"></div>
    {#if label}
        <span class="loading_label">{label}</span>
    {/if}
</div>

<style>
    .loading_overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        gap: var(--spacing_lg);
        align-items: center;
        justify-content: center;
        z-index: 50;
        background: rgba(7, 8, 12, 0.6);
        backdrop-filter: blur(2px);
        border-radius: inherit;
        transition: opacity var(--transition_smooth), visibility var(--transition_smooth);
        opacity: 1;
        visibility: visible;
    }
    .loading_overlay.is_hidden {
        opacity: 0;
        visibility: hidden;
    }
    .loading_spinner {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.14);
        border-top-color: var(--accent_primary);
        animation: overlay_spin 0.8s linear infinite;
    }
    .loading_label {
        font-size: var(--font_size_sm);
        color: var(--text_secondary);
    }
    @keyframes overlay_spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
