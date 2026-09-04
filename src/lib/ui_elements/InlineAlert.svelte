<script>
    export let variant = 'error'; // error, success, info
</script>

<div class="inline_alert inline_alert_{variant}" role="alert">
    <span class="alert_dot" aria-hidden="true"></span>
    <span class="alert_message"><slot /></span>
</div>

<style>
    .inline_alert {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing_md);
        padding: 11px 14px;
        border-radius: var(--radius_md);
        font-size: var(--font_size_sm);
        line-height: 1.45;
    }
    .alert_dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        margin-top: 6px;
        flex-shrink: 0;
    }
    .inline_alert_error {
        background: var(--color_negative_soft);
        border: 1px solid var(--color_negative_border);
        color: #ffb3c4;
    }
    .inline_alert_error .alert_dot {
        background: var(--color_negative);
    }
    .inline_alert_success {
        background: var(--color_positive_soft);
        border: 1px solid rgba(62, 207, 142, 0.4);
        color: #9be9c9;
    }
    .inline_alert_success .alert_dot {
        background: var(--color_positive);
    }
    .inline_alert_info {
        background: var(--accent_primary_soft);
        border: 1px solid var(--accent_primary_border);
        color: #c8ccff;
    }
    .inline_alert_info .alert_dot {
        background: var(--accent_primary);
    }
</style>
