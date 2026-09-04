<script>
    import { onMount } from 'svelte';
    import AppHeader from '$lib/ui_elements/AppHeader.svelte';
    import StatusChip from '$lib/ui_elements/StatusChip.svelte';
    import { ensure_session } from '$lib/session.js';
    import { format_date_time } from '$lib/format_utils.js';

    let user = null;
    let ready = false;

    onMount(async () => {
        user = await ensure_session();
        ready = !!user;
    });

    function user_initials(current_user) {
        const source = ((current_user && (current_user.name || current_user.email)) || '?').trim();
        const parts = source.split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return source.slice(0, 2).toUpperCase();
    }
</script>

<svelte:head>
    <title>Account</title>
</svelte:head>

{#if ready && user}
    <AppHeader active="account" {user} />
    <main class="account_page">
        <div class="app_container">
            <div class="page_head">
                <span class="eyebrow">Your account</span>
                <h1 class="page_title">Account</h1>
                <p class="page_lead">Your identity across every application in the ecosystem.</p>
            </div>

            <div class="account_grid">
                <section class="card identity_card">
                    <div class="identity_head">
                        <span class="identity_avatar" aria-hidden="true">{user_initials(user)}</span>
                        <div class="identity_meta">
                            <h2 class="identity_name">{user.name || 'Unnamed user'}</h2>
                            <span class="identity_email">{user.email || '—'}</span>
                        </div>
                        <StatusChip status={user.status} />
                    </div>

                    <dl class="detail_list">
                        <div class="detail_row">
                            <dt>Full name</dt>
                            <dd>{user.name || '—'}</dd>
                        </div>
                        <div class="detail_row">
                            <dt>Email</dt>
                            <dd>{user.email || '—'}</dd>
                        </div>
                        <div class="detail_row">
                            <dt>Account status</dt>
                            <dd><StatusChip status={user.status} /></dd>
                        </div>
                    </dl>
                </section>

                <section class="card session_card">
                    <span class="eyebrow">Current session</span>
                    <div class="session_field">
                        <span class="session_label">Signed in as</span>
                        <span class="session_value">{user.email || '—'}</span>
                    </div>
                    <div class="session_field">
                        <span class="session_label">Session expires</span>
                        <span class="session_value">{format_date_time(user.expires_at)}</span>
                    </div>
                    <p class="session_note">
                        Sessions last ten minutes and renew each time you sign in.
                    </p>
                </section>
            </div>
        </div>
    </main>
{:else}
    <div class="account_boot">
        <div class="boot_spinner" aria-label="Loading"></div>
    </div>
{/if}

<style>
    .account_page {
        padding: var(--spacing_5xl) 0;
    }
    .page_head {
        display: flex;
        flex-direction: column;
        gap: var(--spacing_sm);
        margin-bottom: var(--spacing_4xl);
    }
    .page_title {
        font-size: var(--font_size_3xl);
    }
    .page_lead {
        font-size: var(--font_size_md);
        color: var(--text_secondary);
    }
    .account_grid {
        display: grid;
        grid-template-columns: 1.6fr 1fr;
        gap: var(--spacing_2xl);
        align-items: start;
    }
    .identity_card,
    .session_card {
        padding: var(--spacing_3xl);
    }
    .identity_head {
        display: flex;
        align-items: center;
        gap: var(--spacing_lg);
        padding-bottom: var(--spacing_2xl);
        border-bottom: 1px solid var(--border_primary);
        margin-bottom: var(--spacing_2xl);
    }
    .identity_avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: var(--radius_md);
        background: var(--grad_accent);
        color: var(--text_on_accent);
        font-family: var(--font_display);
        font-weight: var(--font_weight_bold);
        font-size: var(--font_size_lg);
        flex-shrink: 0;
    }
    .identity_meta {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .identity_name {
        font-size: var(--font_size_xl);
    }
    .identity_email {
        font-size: var(--font_size_md);
        color: var(--text_secondary);
    }
    .detail_list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing_lg);
        margin: 0;
    }
    .detail_row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing_lg);
    }
    .detail_row dt {
        font-size: var(--font_size_xs);
        font-weight: var(--font_weight_semibold);
        letter-spacing: var(--eyebrow_spacing);
        text-transform: uppercase;
        color: var(--text_tertiary);
    }
    .detail_row dd {
        margin: 0;
        font-size: var(--font_size_md);
        color: var(--text_primary);
    }
    .session_card {
        display: flex;
        flex-direction: column;
        gap: var(--spacing_lg);
    }
    .session_field {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .session_label {
        font-size: var(--font_size_xs);
        font-weight: var(--font_weight_semibold);
        letter-spacing: var(--eyebrow_spacing);
        text-transform: uppercase;
        color: var(--text_tertiary);
    }
    .session_value {
        font-size: var(--font_size_md);
        color: var(--text_primary);
        word-break: break-word;
    }
    .session_note {
        font-size: var(--font_size_sm);
        color: var(--text_tertiary);
        margin: 0;
    }
    .account_boot {
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

    @media (max-width: 780px) {
        .account_grid {
            grid-template-columns: 1fr;
        }
    }
</style>
