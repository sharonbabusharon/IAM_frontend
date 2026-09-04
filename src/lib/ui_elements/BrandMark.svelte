<script>
    import { app_brand } from '$lib/config.js';

    export let size = 'lg'; // lg, sm
    export let subtitle = '';
</script>

<div class="brand_mark brand_mark_{size}">
    <span class="brand_glyph" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l7 3v6c0 4.5-3 8.2-7 9-4-.8-7-4.5-7-9V5l7-3z" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    </span>
    <div class="brand_text">
        <span class="brand_name gradient_text">{app_brand}</span>
        {#if subtitle}
            <span class="brand_subtitle">{subtitle}</span>
        {/if}
    </div>
</div>

<style>
    .brand_mark {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing_lg);
    }
    .brand_glyph {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--text_on_accent);
        background: var(--grad_accent);
        box-shadow: var(--shadow_glow);
        flex-shrink: 0;
    }
    .brand_mark_lg .brand_glyph {
        width: 46px;
        height: 46px;
        border-radius: 14px;
    }
    .brand_mark_sm .brand_glyph {
        width: 34px;
        height: 34px;
        border-radius: 10px;
    }
    .brand_text {
        display: flex;
        flex-direction: column;
        line-height: 1.1;
    }
    .brand_name {
        font-family: var(--font_display);
        font-weight: var(--font_weight_bold);
        letter-spacing: -0.01em;
    }
    .brand_mark_lg .brand_name {
        font-size: var(--font_size_2xl);
    }
    .brand_mark_sm .brand_name {
        font-size: var(--font_size_lg);
    }
    .brand_subtitle {
        font-size: var(--font_size_sm);
        color: var(--text_tertiary);
        margin-top: 2px;
    }
</style>
