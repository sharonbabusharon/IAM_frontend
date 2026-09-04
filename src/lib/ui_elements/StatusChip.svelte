<script>
    export let status = 'active';
</script>

<span class="status_chip status_chip_{status}">
    <span class="status_dot" aria-hidden="true"></span>
    {status}
</span>

<style>
    .status_chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: var(--radius_pill);
        font-size: var(--font_size_xs);
        font-weight: var(--font_weight_semibold);
        text-transform: capitalize;
    }
    .status_dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
    }
    .status_chip_active {
        background: var(--color_positive_soft);
        color: var(--color_positive);
    }
    .status_chip_active .status_dot {
        background: var(--color_positive);
    }
    .status_chip_suspended {
        background: var(--color_negative_soft);
        color: var(--color_negative);
    }
    .status_chip_suspended .status_dot {
        background: var(--color_negative);
    }
</style>
