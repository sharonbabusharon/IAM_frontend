<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import AppHeader from '$lib/ui_elements/AppHeader.svelte';
    import StatusChip from '$lib/ui_elements/StatusChip.svelte';
    import InlineAlert from '$lib/ui_elements/InlineAlert.svelte';
    import ConfirmationPopup from '$lib/common_helpers/ConfirmationPopup.svelte';
    import { ensure_session } from '$lib/session.js';
    import { get_provider_meta } from '$lib/providers.js';
    import { format_date } from '$lib/format_utils.js';

    const page_size = 50;

    let user = null;
    let ready = false;

    let users = [];
    let loading = false;
    let load_error = ''; // access_denied, generic
    let action_error = '';
    let query_text = '';
    let status_filter = 'all'; // all, active, suspended
    let offset = 0;
    let has_more = false;
    let row_busy_id = '';

    let confirm_popup;

    onMount(async () => {
        user = await ensure_session();
        if (!user) return;
        ready = true;
        await load_users();
    });

    async function load_users() {
        loading = true;
        load_error = '';
        try {
            const params = new URLSearchParams();
            if (query_text.trim()) params.set('query', query_text.trim());
            if (status_filter !== 'all') params.set('status', status_filter);
            params.set('limit', String(page_size));
            params.set('offset', String(offset));

            const response = await fetch('/framework_api/admin/users?' + params.toString());
            if (response.status === 401) {
                goto('/login', { replaceState: true });
                return;
            }
            const data = await response.json();
            if (!response.ok) {
                load_error = data && data.error === 'not_an_admin' ? 'access_denied' : 'generic';
                users = [];
                has_more = false;
                return;
            }
            users = (data && data.users) || [];
            has_more = users.length === page_size;
        } catch (error) {
            load_error = 'generic';
            users = [];
            has_more = false;
        } finally {
            loading = false;
        }
    }

    function run_search() {
        offset = 0;
        load_users();
    }

    function change_status_filter(next_filter) {
        if (status_filter === next_filter) return;
        status_filter = next_filter;
        offset = 0;
        load_users();
    }

    function next_page() {
        if (!has_more || loading) return;
        offset += page_size;
        load_users();
    }

    function prev_page() {
        if (offset === 0 || loading) return;
        offset = Math.max(0, offset - page_size);
        load_users();
    }

    function handle_search_key(event) {
        if (event.key === 'Enter') run_search();
    }

    function ask_suspend(target) {
        confirm_popup.show({
            title: 'Suspend this user?',
            message:
                (target.full_name || target.email) +
                ' will not be able to sign in. Tokens already issued stay valid for up to ten minutes.',
            variant: 'danger',
            positive_button_text: 'Suspend user',
            on_confirm: () => change_user_status(target, 'suspend')
        });
    }

    function ask_activate(target) {
        confirm_popup.show({
            title: 'Reactivate this user?',
            message: (target.full_name || target.email) + ' will be able to sign in again.',
            variant: 'primary',
            positive_button_text: 'Reactivate user',
            on_confirm: () => change_user_status(target, 'activate')
        });
    }

    async function change_user_status(target, action) {
        action_error = '';
        row_busy_id = target.ecosystem_id;
        try {
            const response = await fetch(
                '/framework_api/admin/users/' + encodeURIComponent(target.ecosystem_id) + '/' + action,
                { method: 'POST' }
            );
            const data = await response.json();
            if (!response.ok) {
                action_error = 'Could not update that user. Please try again.';
                return;
            }
            users = users.map((row) =>
                row.ecosystem_id === target.ecosystem_id ? { ...row, status: data.status } : row
            );
        } catch (error) {
            action_error = 'Could not update that user. Please try again.';
        } finally {
            row_busy_id = '';
        }
    }
</script>

<svelte:head>
    <title>Users · Admin</title>
</svelte:head>

{#if ready}
    <AppHeader active="admin" {user} />
    <main class="admin_page">
        <div class="app_container">
            <div class="page_head">
                <span class="eyebrow">Administration</span>
                <h1 class="page_title">Users</h1>
                <p class="page_lead">View, search, and manage identities across the ecosystem.</p>
            </div>

            <div class="toolbar">
                <div class="search_box">
                    <span class="search_icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    </span>
                    <input
                        class="search_input"
                        type="search"
                        placeholder="Search by name or email"
                        bind:value={query_text}
                        on:keydown={handle_search_key}
                    />
                </div>
                <div class="status_tabs" role="tablist">
                    <button class="status_tab" class:is_active={status_filter === 'all'} on:click={() => change_status_filter('all')}>All</button>
                    <button class="status_tab" class:is_active={status_filter === 'active'} on:click={() => change_status_filter('active')}>Active</button>
                    <button class="status_tab" class:is_active={status_filter === 'suspended'} on:click={() => change_status_filter('suspended')}>Suspended</button>
                </div>
            </div>

            {#if action_error}
                <div class="admin_alert"><InlineAlert variant="error">{action_error}</InlineAlert></div>
            {/if}

            <section class="card table_card">
                <div class="table_scroll">
                    <table class="data_table">
                        <thead>
                            <tr>
                                <th class="col_user">User</th>
                                <th class="col_provider">Provider</th>
                                <th class="col_status">Status</th>
                                <th class="col_created">Created</th>
                                <th class="col_actions" aria-label="Actions"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {#if loading}
                                {#each Array(6) as _skeleton, i (i)}
                                    <tr class="skeleton_row">
                                        <td class="col_user"><div class="skeleton_cell" style="width: 62%"></div></td>
                                        <td class="col_provider"><div class="skeleton_cell" style="width: 55%"></div></td>
                                        <td class="col_status"><div class="skeleton_cell" style="width: 66px"></div></td>
                                        <td class="col_created"><div class="skeleton_cell" style="width: 74px"></div></td>
                                        <td class="col_actions"><div class="skeleton_cell" style="width: 68px; margin-left: auto"></div></td>
                                    </tr>
                                {/each}
                            {:else if load_error === 'access_denied'}
                                <tr>
                                    <td colspan="5">
                                        <div class="table_state">
                                            <span class="table_state_title">Admin access required</span>
                                            <span>Your account is not on the IAM administrator list.</span>
                                        </div>
                                    </td>
                                </tr>
                            {:else if load_error}
                                <tr>
                                    <td colspan="5">
                                        <div class="table_state">
                                            <span class="table_state_title">Could not load users</span>
                                            <button class="retry_button" on:click={load_users}>Try again</button>
                                        </div>
                                    </td>
                                </tr>
                            {:else if users.length === 0}
                                <tr>
                                    <td colspan="5">
                                        <div class="table_state">
                                            <span class="table_state_title">No users found</span>
                                            <span>Try a different search or filter.</span>
                                        </div>
                                    </td>
                                </tr>
                            {:else}
                                {#each users as row (row.ecosystem_id)}
                                    {@const meta = get_provider_meta(row.primary_provider)}
                                    <tr>
                                        <td class="col_user">
                                            <div class="user_cell">
                                                <span class="user_name">{row.full_name || '—'}</span>
                                                <span class="user_email">{row.email}</span>
                                            </div>
                                        </td>
                                        <td class="col_provider">
                                            <span class="provider_tag">
                                                {#if meta.icon}
                                                    <span class="provider_tag_icon" style="color: {meta.brand_color};">{@html meta.icon}</span>
                                                {/if}
                                                {meta.label}
                                            </span>
                                        </td>
                                        <td class="col_status"><StatusChip status={row.status} /></td>
                                        <td class="col_created">{format_date(row.created_at)}</td>
                                        <td class="col_actions">
                                            {#if row.status === 'suspended'}
                                                <button class="row_action row_action_activate" disabled={row_busy_id === row.ecosystem_id} on:click={() => ask_activate(row)}>Activate</button>
                                            {:else}
                                                <button class="row_action row_action_suspend" disabled={row_busy_id === row.ecosystem_id} on:click={() => ask_suspend(row)}>Suspend</button>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            {/if}
                        </tbody>
                    </table>
                </div>

                <div class="table_footer">
                    <span class="row_count">
                        {#if !loading && !load_error && users.length > 0}
                            Showing {users.length} {users.length === 1 ? 'user' : 'users'} · page {offset / page_size + 1}
                        {/if}
                    </span>
                    <div class="pager">
                        <button class="pager_button" disabled={offset === 0 || loading} on:click={prev_page}>Prev</button>
                        <span class="pager_page">{offset / page_size + 1}</span>
                        <button class="pager_button" disabled={!has_more || loading} on:click={next_page}>Next</button>
                    </div>
                </div>
            </section>
        </div>
    </main>

    <ConfirmationPopup bind:this={confirm_popup} />
{:else}
    <div class="admin_boot"><div class="boot_spinner" aria-label="Loading"></div></div>
{/if}

<style>
    .admin_page {
        padding: var(--spacing_4xl) 0 var(--spacing_5xl);
    }
    .page_head {
        display: flex;
        flex-direction: column;
        gap: var(--spacing_sm);
        margin-bottom: var(--spacing_3xl);
    }
    .page_title {
        font-size: var(--font_size_3xl);
    }
    .page_lead {
        font-size: var(--font_size_md);
        color: var(--text_secondary);
    }
    .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing_lg);
        margin-bottom: var(--spacing_2xl);
        flex-wrap: wrap;
    }
    .search_box {
        position: relative;
        flex: 1;
        min-width: 240px;
        max-width: 380px;
    }
    .search_icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text_tertiary);
        display: inline-flex;
        pointer-events: none;
    }
    .search_input {
        width: 100%;
        padding: 11px 14px 11px 40px;
        background: var(--bg_surface);
        border: 1px solid var(--border_primary);
        border-radius: var(--radius_pill);
        color: var(--text_primary);
        font-size: var(--font_size_md);
    }
    .search_input::placeholder {
        color: var(--text_tertiary);
    }
    .search_input:focus {
        outline: none;
        border-color: var(--accent_primary_border);
        box-shadow: 0 0 0 3px var(--accent_primary_soft);
    }
    .status_tabs {
        display: inline-flex;
        padding: 4px;
        background: var(--bg_surface);
        border: 1px solid var(--border_primary);
        border-radius: var(--radius_pill);
        gap: 2px;
    }
    .status_tab {
        padding: 7px 16px;
        border-radius: var(--radius_pill);
        color: var(--text_secondary);
        font-size: var(--font_size_sm);
        font-weight: var(--font_weight_medium);
        background: none;
        border: none;
        cursor: pointer;
        transition: color var(--transition_base), background var(--transition_base);
    }
    .status_tab:hover {
        color: var(--text_primary);
    }
    .status_tab.is_active {
        background: var(--accent_primary_soft);
        color: var(--text_primary);
    }
    .admin_alert {
        margin-bottom: var(--spacing_lg);
    }
    .table_card {
        padding: 0;
        overflow: hidden;
    }
    .table_scroll {
        overflow-x: auto;
    }
    .data_table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--font_size_md);
    }
    .data_table thead th {
        text-align: left;
        padding: 14px var(--spacing_2xl);
        font-size: var(--font_size_xs);
        font-weight: var(--font_weight_semibold);
        letter-spacing: var(--eyebrow_spacing);
        text-transform: uppercase;
        color: var(--text_tertiary);
        background: var(--bg_surface_2);
        border-bottom: 1px solid var(--border_primary);
        white-space: nowrap;
    }
    .data_table tbody td {
        padding: 14px var(--spacing_2xl);
        border-bottom: 1px solid var(--border_secondary);
        vertical-align: middle;
    }
    .data_table tbody tr:last-child td {
        border-bottom: none;
    }
    .data_table tbody tr {
        transition: background var(--transition_base);
    }
    .data_table tbody tr:hover {
        background: var(--bg_hover);
    }
    .col_actions {
        text-align: right;
    }
    .user_cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .user_name {
        font-weight: var(--font_weight_semibold);
        color: var(--text_primary);
    }
    .user_email {
        font-size: var(--font_size_sm);
        color: var(--text_secondary);
    }
    .provider_tag {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing_md);
        color: var(--text_secondary);
        text-transform: capitalize;
    }
    .provider_tag_icon {
        display: inline-flex;
        width: 18px;
        height: 18px;
    }
    .provider_tag_icon :global(svg) {
        width: 16px;
        height: 16px;
        display: block;
    }
    .col_created {
        color: var(--text_secondary);
        white-space: nowrap;
    }
    .row_action {
        padding: 7px 14px;
        border-radius: var(--radius_pill);
        font-size: var(--font_size_sm);
        font-weight: var(--font_weight_semibold);
        cursor: pointer;
        border: 1px solid transparent;
        background: transparent;
        transition: background var(--transition_base), color var(--transition_base);
        white-space: nowrap;
    }
    .row_action:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .row_action_suspend {
        color: var(--color_negative);
        border-color: var(--color_negative_border);
    }
    .row_action_suspend:hover:not(:disabled) {
        background: var(--color_negative_soft);
    }
    .row_action_activate {
        color: var(--color_positive);
        border-color: rgba(62, 207, 142, 0.4);
    }
    .row_action_activate:hover:not(:disabled) {
        background: var(--color_positive_soft);
    }
    .table_state {
        padding: var(--spacing_5xl) var(--spacing_2xl);
        text-align: center;
        color: var(--text_secondary);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing_md);
    }
    .table_state_title {
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
    .skeleton_cell {
        height: 14px;
        border-radius: 6px;
        background: linear-gradient(90deg, var(--bg_surface_2), var(--bg_surface_3), var(--bg_surface_2));
        background-size: 200% 100%;
        animation: skeleton_shine 1.3s ease-in-out infinite;
    }
    @keyframes skeleton_shine {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }
    .table_footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing_lg) var(--spacing_2xl);
        border-top: 1px solid var(--border_primary);
        gap: var(--spacing_lg);
        flex-wrap: wrap;
    }
    .row_count {
        font-size: var(--font_size_sm);
        color: var(--text_tertiary);
    }
    .pager {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing_md);
        margin-left: auto;
    }
    .pager_button {
        padding: 6px 14px;
        border-radius: var(--radius_pill);
        border: 1px solid var(--border_primary);
        background: var(--bg_surface_2);
        color: var(--text_secondary);
        font-size: var(--font_size_sm);
        font-weight: var(--font_weight_medium);
        cursor: pointer;
    }
    .pager_button:hover:not(:disabled) {
        color: var(--text_primary);
        border-color: var(--border_strong);
    }
    .pager_button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }
    .pager_page {
        min-width: 30px;
        text-align: center;
        font-size: var(--font_size_sm);
        font-weight: var(--font_weight_semibold);
        color: var(--text_primary);
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

    @media (max-width: 640px) {
        .toolbar {
            flex-direction: column;
            align-items: stretch;
        }
        .search_box {
            max-width: none;
        }
    }
</style>
