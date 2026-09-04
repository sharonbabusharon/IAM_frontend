<script>
    import { goto } from '$app/navigation';
    import BrandMark from './BrandMark.svelte';
    import { clear_session_user } from '$lib/session.js';

    export let active = ''; // account, admin
    export let user = null;

    let logging_out = false;

    async function handle_logout() {
        if (logging_out) return;
        logging_out = true;
        try {
            await fetch('/auth/logout', { method: 'POST' });
        } catch (error) {
        }
        clear_session_user();
        goto('/login', { replaceState: true });
    }

    function user_initial(current_user) {
        const source = ((current_user && (current_user.name || current_user.email)) || '?').trim();
        return source.slice(0, 1).toUpperCase();
    }
</script>

<header class="app_header">
    <div class="app_container header_inner">
        <a class="header_brand" href="/account">
            <BrandMark size="sm" />
        </a>

        <nav class="header_nav">
            <a class="nav_link" class:is_active={active === 'account'} href="/account">Account</a>
            <a class="nav_link" class:is_active={active === 'admin'} href="/admin/users">Admin</a>
        </nav>

        <div class="header_actions">
            {#if user}
                <span class="header_avatar" title={user.email}>{user_initial(user)}</span>
            {/if}
            <button class="logout_button" on:click={handle_logout} disabled={logging_out}>
                {logging_out ? 'Signing out…' : 'Sign out'}
            </button>
        </div>
    </div>
</header>

<style>
    .app_header {
        position: sticky;
        top: 0;
        z-index: 40;
        background: rgba(8, 9, 14, 0.72);
        backdrop-filter: blur(14px);
        border-bottom: 1px solid var(--border_primary);
    }
    .header_inner {
        display: flex;
        align-items: center;
        gap: var(--spacing_3xl);
        height: var(--main_header_height);
    }
    .header_brand {
        display: inline-flex;
        color: inherit;
    }
    .header_nav {
        display: flex;
        align-items: center;
        gap: var(--spacing_xs);
        margin-right: auto;
    }
    .nav_link {
        padding: 7px 14px;
        border-radius: var(--radius_pill);
        color: var(--text_secondary);
        font-size: var(--font_size_md);
        font-weight: var(--font_weight_medium);
        transition: color var(--transition_base), background var(--transition_base);
    }
    .nav_link:hover {
        color: var(--text_primary);
        background: var(--bg_hover);
    }
    .nav_link.is_active {
        color: var(--text_primary);
        background: var(--accent_primary_soft);
    }
    .header_actions {
        display: flex;
        align-items: center;
        gap: var(--spacing_lg);
    }
    .header_avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: var(--grad_accent);
        color: var(--text_on_accent);
        font-weight: var(--font_weight_bold);
        font-size: var(--font_size_sm);
    }
    .logout_button {
        padding: 8px 14px;
        border-radius: var(--radius_pill);
        border: 1px solid var(--border_primary);
        background: transparent;
        color: var(--text_secondary);
        font-size: var(--font_size_sm);
        font-weight: var(--font_weight_medium);
        cursor: pointer;
        transition: color var(--transition_base), border-color var(--transition_base);
    }
    .logout_button:hover:not(:disabled) {
        color: var(--text_primary);
        border-color: var(--border_strong);
    }
    .logout_button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    @media (max-width: 620px) {
        .header_inner {
            gap: var(--spacing_lg);
        }
        .header_nav {
            gap: 0;
        }
        .nav_link {
            padding: 7px 10px;
        }
    }
</style>
