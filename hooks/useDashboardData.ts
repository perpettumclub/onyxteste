import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Task, Lead, Post, Module, SalesMetrics, Transaction, TaskStatus, FinancialGoal } from '../types';
import { debugLog } from '../config/debug';

export const useDashboardData = (tenantId: string | null) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [salesMetrics, setSalesMetrics] = useState<SalesMetrics>({
        grossTotal: 0,
        platformFeePercentage: 0.05,
        expertSplitPercentage: 0.60,
        teamSplitPercentage: 0.40
    });
    const [financialGoal, setFinancialGoal] = useState<FinancialGoal>({
        current: 0,
        target: 100000,
        startDate: '2023-11-01'
    });
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!tenantId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                debugLog('API', 'Fetching dashboard data for tenant:', tenantId);

                // 1. Fetch Tasks
                const { data: tasksData, error: tasksError } = await supabase
                    .from('tasks')
                    .select(`
            *,
            assignee:profiles(full_name)
          `)
                    .eq('tenant_id', tenantId);

                if (tasksError) throw tasksError;

                const formattedTasks: Task[] = (tasksData || []).map(t => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    status: t.status as TaskStatus,
                    assignee: t.assignee?.full_name || 'Unassigned',
                    dueDate: t.due_date,
                    comments: [] // TODO: Fetch comments if needed
                }));
                setTasks(formattedTasks);

                // 2. Fetch Leads
                const { data: leadsData, error: leadsError } = await supabase
                    .from('leads')
                    .select('*')
                    .eq('tenant_id', tenantId);

                if (leadsError) throw leadsError;

                const formattedLeads: Lead[] = (leadsData || []).map(l => ({
                    id: l.id,
                    name: l.name,
                    email: l.email,
                    company: l.company,
                    value: Number(l.value),
                    status: l.status,
                    lastContact: l.last_contact
                }));
                setLeads(formattedLeads);

                // 3. Fetch Modules (LMS) with Lessons
                const { data: modulesData, error: modulesError } = await supabase
                    .from('modules')
                    .select(`
                        *,
                        lessons (*)
                    `)
                    .eq('tenant_id', tenantId)
                    .order('order_index');

                if (modulesError) throw modulesError;

                // 3b. Fetch user's lesson progress
                const { data: { user } } = await supabase.auth.getUser();
                let progressMap: Record<string, boolean> = {};

                if (user) {
                    const allLessonIds = (modulesData || []).flatMap((m: any) => (m.lessons || []).map((l: any) => l.id));
                    if (allLessonIds.length > 0) {
                        const { data: progressData } = await supabase
                            .from('lesson_progress')
                            .select('lesson_id, is_completed')
                            .eq('user_id', user.id)
                            .in('lesson_id', allLessonIds);

                        progressData?.forEach((p: any) => {
                            progressMap[p.lesson_id] = p.is_completed;
                        });
                    }
                }

                const formattedModules: Module[] = (modulesData || []).map(m => ({
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    imageUrl: m.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
                    lessons: (m.lessons || []).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)).map((l: any) => ({
                        id: l.id,
                        title: l.title,
                        duration: l.duration || '00:00',
                        type: l.type,
                        isCompleted: progressMap[l.id] || false,
                        contentUrl: l.content_url
                    }))
                }));
                setModules(formattedModules);

                // 4. Fetch Posts
                const { data: postsData, error: postsError } = await supabase
                    .from('posts')
                    .select(`
                        *,
                        author:profiles(full_name, role, avatar_url)
                    `)
                    .eq('tenant_id', tenantId)
                    .order('created_at', { ascending: false });

                if (postsError) throw postsError;

                const formattedPosts: Post[] = (postsData || []).map(p => ({
                    id: p.id,
                    author: p.author?.full_name || 'Unknown',
                    authorRole: p.author?.role || 'USER',
                    avatar: p.author?.avatar_url,
                    time: new Date(p.created_at).toLocaleDateString(), // Simplified time
                    content: p.content,
                    likes: p.likes,
                    comments: p.comments,
                    pinned: false, // Not in DB yet
                    title: 'Post' // Not in DB
                }));
                setPosts(formattedPosts);

                // 5. Fetch Transactions
                const { data: transactionsData, error: transactionsError } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .order('date', { ascending: false });

                if (transactionsError) throw transactionsError;

                const formattedTransactions: Transaction[] = (transactionsData || []).map(t => ({
                    id: t.id,
                    customerName: 'Cliente', // Placeholder as DB doesn't have customer_id yet
                    productName: t.description,
                    amount: Number(t.amount),
                    date: t.date,
                    status: t.status === 'COMPLETED' ? 'APPROVED' : t.status === 'PENDING' ? 'PENDING' : 'REFUNDED'
                }));
                setTransactions(formattedTransactions);

                setTransactions(formattedTransactions);

                // 6. Fetch Sales Config & Calculate Metrics
                const { data: configData, error: configError } = await supabase
                    .from('sales_config')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .single();

                // It's okay if no config exists yet, we'll use defaults
                if (configError && configError.code !== 'PGRST116') {
                    console.error('Error fetching sales config:', configError);
                }

                const transactionSum = formattedTransactions
                    .filter(t => t.status === 'APPROVED')
                    .reduce((sum, t) => sum + t.amount, 0);

                const salesConfig = configData || {};

                // Use manual gross revenue if set, otherwise use transaction sum
                const grossTotal = salesConfig.manual_gross_revenue !== null && salesConfig.manual_gross_revenue !== undefined
                    ? Number(salesConfig.manual_gross_revenue)
                    : transactionSum;

                const calculatedSalesMetrics: SalesMetrics = {
                    grossTotal,
                    platformFeePercentage: Number(salesConfig.platform_fee_percentage) || 0.05,
                    expertSplitPercentage: Number(salesConfig.expert_split_percentage) || 0.60,
                    teamSplitPercentage: Number(salesConfig.team_split_percentage) || 0.40,
                    manualGrossRevenue: salesConfig.manual_gross_revenue ? Number(salesConfig.manual_gross_revenue) : undefined,
                    manualDailyAverage: salesConfig.manual_daily_average ? Number(salesConfig.manual_daily_average) : undefined,
                    manualProjectionDays: salesConfig.manual_projection_days ? Number(salesConfig.manual_projection_days) : undefined,
                    customTaxes: salesConfig.custom_taxes || []
                };
                setSalesMetrics(calculatedSalesMetrics);

                const calculatedFinancialGoal: FinancialGoal = {
                    current: grossTotal,
                    target: Number(salesConfig.financial_goal_target) || 100000,
                    startDate: salesConfig.financial_goal_start_date || '2023-11-01'
                };
                setFinancialGoal(calculatedFinancialGoal);

            } catch (error: any) {
                console.error('Error fetching dashboard data:', error);
                debugLog('API', 'Error fetching data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tenantId, refreshKey]);

    const refetch = () => setRefreshKey(k => k + 1);

    return { tasks, setTasks, leads, setLeads, posts, setPosts, modules, setModules, transactions, setTransactions, salesMetrics, setSalesMetrics, financialGoal, setFinancialGoal, loading, refetch };
};
