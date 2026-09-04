<script>
    let dialog_element;
    let popup_title = '';
    let popup_message = '';
    let positive_button_text = 'Confirm';
    let negative_button_text = 'Cancel';
    let popup_variant = 'primary'; // primary, danger
    let positive_callback = null;
    let is_busy = false;
    let show_dialog = false;

    export function show(config) {
        popup_title = config.title || '';
        popup_message = config.message || '';
        positive_button_text = config.positive_button_text || 'Confirm';
        negative_button_text = config.negative_button_text || 'Cancel';
        popup_variant = config.variant || 'primary';
        positive_callback = config.on_confirm || null;
        is_busy = false;
        show_dialog = true;
        if (dialog_element && !dialog_element.open) {
            dialog_element.showModal();
        }
    }

    export function hide() {
        show_dialog = false;
        is_busy = false;
        if (dialog_element && dialog_element.open) {
            dialog_element.close();
        }
    }

    async function handle_confirm() {
        if (is_busy) return;
        if (!positive_callback) {
            hide();
            return;
        }
        is_busy = true;
        try {
            await positive_callback();
            hide();
        } catch (error) {
            is_busy = false;
        }
    }

    function handle_cancel() {
        if (is_busy) return;
        hide();
    }
</script>

<dialog bind:this={dialog_element} class="confirm_dialog" on:cancel|preventDefault={handle_cancel}>
    {#if show_dialog}
        <div class="confirm_body confirm_body_{popup_variant}">
            <span class="confirm_icon" aria-hidden="true">
                {#if popup_variant === 'danger'}
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                {:else}
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
                {/if}
            </span>
            <h3 class="confirm_title">{popup_title}</h3>
            {#if popup_message}
                <p class="confirm_message">{popup_message}</p>
            {/if}
            <div class="confirm_actions">
                <button
                    class="confirm_positive confirm_positive_{popup_variant}"
                    on:click={handle_confirm}
                    disabled={is_busy}
                >
                    {is_busy ? 'Working…' : positive_button_text}
                </button>
                <button class="confirm_negative" on:click={handle_cancel} disabled={is_busy}>
                    {negative_button_text}
                </button>
            </div>
        </div>
    {/if}
</dialog>

<style>
    .confirm_dialog {
        margin: auto;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--text_primary);
        max-width: 420px;
        width: calc(100vw - 32px);
    }
    .confirm_dialog::backdrop {
        background: rgba(4, 5, 9, 0.66);
        backdrop-filter: blur(3px);
    }
    .confirm_body {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: var(--spacing_lg);
        padding: var(--spacing_4xl) var(--spacing_3xl) var(--spacing_3xl);
        background: var(--bg_elevated);
        border: 1px solid var(--border_strong);
        border-radius: var(--radius_xl);
        box-shadow: var(--shadow_lg);
    }
    .confirm_icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        border-radius: var(--radius_md);
        margin-bottom: var(--spacing_xs);
    }
    .confirm_body_primary .confirm_icon {
        background: var(--accent_primary_soft);
        color: var(--accent_primary);
    }
    .confirm_body_danger .confirm_icon {
        background: var(--color_negative_soft);
        color: var(--color_negative);
    }
    .confirm_title {
        font-size: var(--font_size_xl);
    }
    .confirm_message {
        font-size: var(--font_size_md);
        color: var(--text_secondary);
        margin: 0;
    }
    .confirm_actions {
        display: flex;
        flex-direction: column;
        gap: var(--spacing_md);
        width: 100%;
        margin-top: var(--spacing_md);
    }
    .confirm_positive {
        width: 100%;
        padding: 12px 20px;
        border-radius: var(--radius_pill);
        font-size: var(--font_size_md);
        font-weight: var(--font_weight_semibold);
        cursor: pointer;
        color: var(--text_on_accent);
        background: var(--grad_accent);
        box-shadow: var(--shadow_glow);
        transition: filter var(--transition_base);
    }
    .confirm_positive_danger {
        background: linear-gradient(135deg, #f2557a 0%, #e0568a 100%);
        color: #ffffff;
        box-shadow: 0 10px 30px -10px rgba(242, 85, 122, 0.6);
    }
    .confirm_positive:hover:not(:disabled) {
        filter: brightness(1.06);
    }
    .confirm_positive:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    .confirm_negative {
        padding: 8px;
        background: none;
        border: none;
        color: var(--text_secondary);
        font-size: var(--font_size_md);
        cursor: pointer;
    }
    .confirm_negative:hover:not(:disabled) {
        color: var(--text_primary);
    }
</style>
