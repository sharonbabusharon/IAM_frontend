<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import AppHeader from '$lib/ui_elements/AppHeader.svelte';
    import InlineAlert from '$lib/ui_elements/InlineAlert.svelte';
    import { ensure_session } from '$lib/session.js';
    import { get_provider_meta } from '$lib/providers.js';

    let user = null;
    let ready = false;

    let providers = [];
    let loading = false;
    let load_error = ''; // access_denied, generic
    let action_error = '';
    let busy_slug = '';

    $: enabled_count = providers.filter((entry) => entry.enabled).length;

    onMount(async () => {
        user = await ensure_session();
        if (!user) return;
        ready = true;
        await load_providers();
    });

    async function load_providers() {
        loading = true;
        load_error = '';
        try {
            const response = await fetch('/framework_api/admin/providers');
            if (response.status === 401) {
                goto('/login', { replaceState: true });
                return;
            }
            const data = await response.json();
            if (!response.ok) {
                load_error = data && data.error === 'not_an_admin' ? 'access_denied' : 'generic';
                providers = [];
                return;
            }
            providers = (data && data.providers) || [];
        } catch (error) {
            load_error = 'generic';
            providers = [];
        } finally {
            loading = false;
        }
    }

    async function toggle_provider(entry) {
        if (busy_slug) return;
        action_error = '';
        const previous_enabled = entry.enabled;
        const next_enabled = !entry.enabled;
        busy_slug = entry.provider;

        providers = providers.map((item) =>
            item.provider === entry.provider ? { ...item, enabled: next_enabled } : item
        );

        try {
            const response = await fetch(
                '/framework_api/admin/providers/' + encodeURIComponent(entry.provider),
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled: next_enabled })
                }
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error((data && data.error) || 'request_failed');
            }
            providers = providers.map((item) =>
                item.provider === entry.provider ? { ...item, enabled: !!data.enabled } : item
            );
        } catch (error) {
            providers = providers.map((item) =>
                item.provider === entry.provider ? { ...item, enabled: previous_enabled } : item
            );
            action_error = 'Could not update that provider. Please try again.';
        } finally {
            busy_slug = '';
        }
    }
</script>

<svelte:head>
    <title>Providers · Admin</title>
</svelte:head>

{#if ready}
    <AppHeader active="admin" {user} />
    <main class="admin_page">
        <div class="app_container narrow">
            <div class="page_head">
                <span class="eyebrow">Administration</span>
                <h1 class="page_title">Sign-in providers</h1>
                <p class="page_lead">
                    Turn providers on or off for the whole ecosystem. Changes take effect immediately.
                </p>
            </div>

            <div class="sub_nav">
                <a class="sub_nav_link" href="/admin/users">Users</a>
                <a class="sub_nav_link is_active" href="/admin/providers">Providers</a>
            </div>

            {#if action_error}
                <div class="admin_alert"><InlineAlert variant="error">{action_error}</InlineAlert></div>
            {/if}

            <section class="card providers_card">
                {#if loading}
                    {#each Array(6) as _skeleton, i (i)}
                        <div class="provider_row">
                            <div class="skeleton_icon"></div>
                            <div class="provider_row_meta">
                                <div class="skeleton_cell" style="width: 120px"></div>
                                <div class="skeleton_cell" style="width: 70px; height: 10px"></div>
                            </div>
                            <div class="skeleton_toggle"></div>
                        </div>
                    {/each}
                {:else if load_error === 'access_denied'}
                    <div class="providers_state">
                        <span class="providers_state_title">Admin access required</span>
                        <span>Your account is not on the IAM administrator list.</span>
                    </div>
                {:else if load_error}
                    <div class="providers_state">
                        <span class="providers_state_title">Could not load providers</span>
                        <button class="retry_button" on:click={load_providers}>Try again</button>
                    </div>
                {:else}
                    {#each providers as entry (entry.provider)}
                        {@const meta = get_provider_meta(entry.provider)}
                        <div class="provider_row">
                            <span class="provider_row_icon" style="color: {meta.brand_color};">{@html meta.icon}</span>
                            <div class="provider_row_meta">
                                <span class="provider_row_name">{meta.label}</span>
                                <span class="provider_row_state" class:is_on={entry.enabled}>
                                    {entry.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <button
                                class="toggle_switch"
                                class:is_on={entry.enabled}
                                role="switch"
                                aria-checked={entry.enabled}
                                aria-label={(entry.enabled ? 'Disable ' : 'Enable ') + meta.label}
                                disabled={busy_slug === entry.provider}
                                on:click={() => toggle_provider(entry)}
                            >
                                <span class="toggle_knob"></span>
                            </button>
                        </div>
                    {/each}
                {/if}
            </section>

            {#if !loading && !load_error}
                <p class="providers_summary">{enabled_count} of {providers.length} providers enabled.</p>
            {/if}
        </div>
    </main>
{:else}
    <div class="admin_boot"><div class="boot_spinner" aria-label="Loading"></div></div>
{/if}

<style>
    .admin_page {
        padding: var(--spacing_4xl) 0 var(--spacing_5xl);
    }
    .narrow {
        max-width: 720px;
    }
    .page_head {
        display: flex;
        flex-direction: column;
        gap: var(--spacing_sm);
        margin-bottom: var(--spacing_2xl);
    }
    .page_title {
        font-size: var(--font_size_3xl);
    }
    .page_lead {
        font-size: var(--font_size_md);
        color: var(--text_secondary);
    }
    .sub_nav {
        display: inline-flex;
        gap: 2px;
        padding: 4px;
        background: var(--bg_surface);
        border: 1px solid var(--border_primary);
        border-radius: var(--radius_pill);
        margin-bottom: var(--spacing_2xl);
    }
    .sub_nav_link {
        padding: 7px 16px;
        border-radius: var(--radius_pill);
        color: var(--text_secondary);
        font-size: var(--font_size_sm);
        font-weight: var(--font_weight_medium);
    }
    .sub_nav_link:hover {
        color: var(--text_primary);
    }
    .sub_nav_link.is_active {
        background: var(--accent_primary_soft);
        color: var(--text_primary);
    }
    .admin_alert {
        margin-bottom: var(--spacing_lg);
    }
    .providers_card {
        padding: var(--spacing_xs) 0;
    }
    .provider_row {
        display: flex;
        align-items: center;
        gap: var(--spacing_lg);
        padding: var(--spacing_lg) var(--spacing_3xl);
        border-bottom: 1px solid var(--border_secondary);
    }
    .provider_row:last-child {
        border-bottom: none;
    }
    .provider_row_icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: var(--radius_md);
        background: var(--bg_surface_2);
        border: 1px solid var(--border_primary);
        flex-shrink: 0;
    }
    .provider_row_icon :global(svg) {
        width: 20px;
        height: 20px;
        display: block;
    }
    .provider_row_meta {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .provider_row_name {
        font-weight: var(--font_weight_semibold);
    }
    .provider_row_state {
        font-size: var(--font_size_sm);
        color: var(--text_tertiary);
    }
    .provider_row_state.is_on {
        color: var(--color_positive);
    }
    .toggle_switch {
        position: relative;
        width: 44px;
        height: 26px;
        border-radius: 999px;
        background: var(--bg_surface_3);
        border: 1px solid var(--border_strong);
        cursor: pointer;
        transition: background var(--transition_base), border-color var(--transition_base);
        flex-shrink: 0;
        padding: 0;
    }
    .toggle_switch.is_on {
        background: var(--grad_accent);
        border-color: transparent;
    }
    .toggle_switch:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    .toggle_knob {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #ffffff;
        transition: transform var(--transition_base);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }
    .toggle_switch.is_on .toggle_knob {
        transform: translateX(18px);
    }
    .providers_state {
        padding: var(--spacing_5xl) var(--spacing_2xl);
        text-align: center;
        color: var(--text_secondary);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing_md);
    }
    .providers_state_title {
        font-size: var(--font_size_lg);
        color: var(--text_primary);
        font-family: var(--font_display);
        font-weight: var(--font_weight_semibold);
    }
    .retry_button {
        margin-top: var(--spacing_xs);
        padding: 8px 16px;
        border-radius: var(--radius_pill);
        border: 1px solid var(--border_strong);
        background: var(--bg_surface_2);
        color: var(--text_primary);
        font-size: var(--font_size_sm);
        font-weight: var(--font_weight_semibold);
        cursor: pointer;
    }
    .providers_summary {
        font-size: var(--font_size_sm);
        color: var(--text_tertiary);
        margin-top: var(--spacing_lg);
    }
    .skeleton_cell {
        height: 14px;
        border-radius: 6px;
        background: linear-gradient(90deg, var(--bg_surface_2), var(--bg_surface_3), var(--bg_surface_2));
        background-size: 200% 100%;
        animation: skeleton_shine 1.3s ease-in-out infinite;
    }
    .skeleton_icon {
        width: 40px;
        height: 40px;
        border-radius: var(--radius_md);
        background: var(--bg_surface_2);
        flex-shrink: 0;
    }
    .skeleton_toggle {
        width: 44px;
        height: 26px;
        border-radius: 999px;
        background: var(--bg_surface_2);
        flex-shrink: 0;
    }
    @keyframes skeleton_shine {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }
    .admin_boot {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .boot_spinner {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.14);
        border-top-color: var(--accent_primary);
        animation: boot_spin 0.8s linear infinite;
    }
    @keyframes boot_spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
