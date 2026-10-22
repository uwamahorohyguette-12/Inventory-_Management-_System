import { useEffect, useMemo, useState } from "react";
import { getAssets } from "../services/api";
import { useFeedback } from "../components/useFeedback";
import "./Reports.css";

const DIMENSIONS = [
    { value: "category", label: "Category" },
    { value: "assetStatus", label: "Asset status" },
    { value: "conditionStatus", label: "Condition" },
];

const CHART_COLORS = ["#3978f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef6b73", "#06b6d4"];

const displayValue = (value) =>
    String(value || "Unknown")
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

function getUniqueValues(items, field) {
    return [...new Set(items.map((item) => item[field] || "Unknown"))].sort((first, second) =>
        String(first).localeCompare(String(second))
    );
}

function buildDonutGradient(entries) {
    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    if (!total) {
        return "conic-gradient(#e9eef5 0 100%)";
    }

    let currentPercent = 0;
    const segments = entries.map(([, count], index) => {
        const nextPercent = currentPercent + (count / total) * 100;
        const segment = `${CHART_COLORS[index % CHART_COLORS.length]} ${currentPercent}% ${nextPercent}%`;
        currentPercent = nextPercent;
        return segment;
    });

    return `conic-gradient(${segments.join(", ")})`;
}

function escapeCsv(value) {
    return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function Reports() {
    const showToast = useFeedback();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [rowDimension, setRowDimension] = useState("category");
    const [columnDimension, setColumnDimension] = useState("assetStatus");

    const loadReportData = async (showSuccess = false) => {
        try {
            setLoading(true);
            setError("");
            const data = await getAssets();
            setAssets(Array.isArray(data) ? data : []);
            if (showSuccess) {
                showToast("Report data refreshed.");
            }
        } catch (loadError) {
            console.error("Could not load report data:", loadError);
            setError("Could not load report data. Check that the backend is running.");
            showToast("Could not load report data.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        async function fetchInitialReportData() {
            try {
                const data = await getAssets();
                if (!cancelled) {
                    setAssets(Array.isArray(data) ? data : []);
                }
            } catch (loadError) {
                console.error("Could not load report data:", loadError);
                if (!cancelled) {
                    setError("Could not load report data. Check that the backend is running.");
                    showToast("Could not load report data.", "error");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchInitialReportData();
        return () => {
            cancelled = true;
        };
    }, [showToast]);

    const categories = useMemo(() => getUniqueValues(assets, "category"), [assets]);
    const filteredAssets = useMemo(
        () => categoryFilter === "all"
            ? assets
            : assets.filter((asset) => (asset.category || "Unknown") === categoryFilter),
        [assets, categoryFilter]
    );

    const statusEntries = useMemo(() => {
        const counts = new Map();
        filteredAssets.forEach((asset) => {
            const status = asset.assetStatus || "Unknown";
            counts.set(status, (counts.get(status) || 0) + 1);
        });
        return [...counts.entries()].sort(([first], [second]) => first.localeCompare(second));
    }, [filteredAssets]);

    const categoryEntries = useMemo(() => {
        const counts = new Map();
        filteredAssets.forEach((asset) => {
            const category = asset.category || "Unknown";
            counts.set(category, (counts.get(category) || 0) + 1);
        });
        return [...counts.entries()].sort(([first], [second]) => first.localeCompare(second));
    }, [filteredAssets]);

    const conditionCounts = useMemo(() => {
        const counts = new Map();
        filteredAssets.forEach((asset) => {
            const condition = asset.conditionStatus || "Unknown";
            counts.set(condition, (counts.get(condition) || 0) + 1);
        });
        return counts;
    }, [filteredAssets]);

    const pivotColumns = useMemo(
        () => getUniqueValues(filteredAssets, columnDimension),
        [filteredAssets, columnDimension]
    );
    const pivotRows = useMemo(
        () => getUniqueValues(filteredAssets, rowDimension),
        [filteredAssets, rowDimension]
    );
    const pivot = useMemo(() => {
        const rows = pivotRows.map((rowValue) => {
            const counts = pivotColumns.map((columnValue) => filteredAssets.filter(
                (asset) => (asset[rowDimension] || "Unknown") === rowValue
                    && (asset[columnDimension] || "Unknown") === columnValue
            ).length);
            return { label: rowValue, counts, total: counts.reduce((sum, count) => sum + count, 0) };
        });
        const columnTotals = pivotColumns.map((_, columnIndex) =>
            rows.reduce((sum, row) => sum + row.counts[columnIndex], 0)
        );
        return { rows, columnTotals, grandTotal: filteredAssets.length };
    }, [filteredAssets, pivotColumns, pivotRows, rowDimension, columnDimension]);

    const availableCount = filteredAssets.filter((asset) => asset.assetStatus === "IN_STOCK").length;
    const assignedCount = filteredAssets.filter((asset) => asset.assetStatus === "ASSIGNED").length;
    const damagedCount = filteredAssets.filter((asset) => asset.conditionStatus === "DAMAGED").length;
    const donutBackground = buildDonutGradient(statusEntries);
    const largestCategoryCount = Math.max(1, ...categoryEntries.map(([, count]) => count));

    const exportCsv = () => {
        if (!filteredAssets.length) {
            showToast("There is no report data to export.", "error");
            return;
        }

        const columns = ["id", "itemName", "category", "conditionStatus", "assetStatus"];
        const lines = [
            columns.map(escapeCsv).join(","),
            ...filteredAssets.map((asset) => columns.map((column) => escapeCsv(asset[column])).join(",")),
        ];
        const file = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
        const fileUrl = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = "inventory-report.csv";
        link.click();
        URL.revokeObjectURL(fileUrl);
        showToast("Inventory report exported as CSV.");
    };

    return (
        <main className="reports-page">
            <header className="reports-header">
                <div>
                    <span className="reports-eyebrow">INVENTORY INSIGHTS</span>
                    <h1>Reports</h1>
                    <p>Explore asset distribution, condition, and status.</p>
                </div>
                <div className="reports-header-actions">
                    <button type="button" className="report-button report-button-secondary" onClick={() => loadReportData(true)} disabled={loading}>
                        <span aria-hidden="true">↻</span> {loading ? "Refreshing..." : "Refresh"}
                    </button>
                    <button type="button" className="report-button report-button-primary" onClick={exportCsv} disabled={loading}>
                        <span aria-hidden="true">⇩</span> Export CSV
                    </button>
                </div>
            </header>

            {error && <div className="reports-error" role="alert">{error}</div>}

            <section className="reports-filter-bar" aria-label="Report filters">
                <div>
                    <span className="filter-caption">Showing</span>
                    <strong>{loading ? "Loading inventory..." : `${filteredAssets.length} assets`}</strong>
                </div>
                <label className="report-filter">
                    <span>Category</span>
                    <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                        <option value="all">All categories</option>
                        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                </label>
            </section>

            <section className="report-metrics" aria-label="Inventory summary">
                <article className="report-metric">
                    <span className="metric-icon metric-icon-blue" aria-hidden="true">▦</span>
                    <div><span>Total assets</span><strong>{loading ? "—" : filteredAssets.length}</strong></div>
                    <small>In current view</small>
                </article>
                <article className="report-metric">
                    <span className="metric-icon metric-icon-green" aria-hidden="true">✓</span>
                    <div><span>In stock</span><strong>{loading ? "—" : availableCount}</strong></div>
                    <small>Available to assign</small>
                </article>
                <article className="report-metric">
                    <span className="metric-icon metric-icon-violet" aria-hidden="true">↗</span>
                    <div><span>Assigned</span><strong>{loading ? "—" : assignedCount}</strong></div>
                    <small>Currently in use</small>
                </article>
                <article className="report-metric">
                    <span className="metric-icon metric-icon-orange" aria-hidden="true">!</span>
                    <div><span>Damaged</span><strong>{loading ? "—" : damagedCount}</strong></div>
                    <small>Needs attention</small>
                </article>
            </section>

            <section className="report-chart-grid" aria-label="Inventory charts">
                <article className="report-card category-chart-card">
                    <div className="report-card-heading">
                        <div><h2>Assets by category</h2><p>Inventory volume by equipment type</p></div>
                        <span className="chart-menu-mark" aria-hidden="true">•••</span>
                    </div>
                    {categoryEntries.length ? (
                        <div className="category-bars">
                            {categoryEntries.map(([category, count], index) => (
                                <div className="category-bar-row" key={category}>
                                    <span className="category-bar-label">{category}</span>
                                    <div className="category-bar-track" role="img" aria-label={`${category}: ${count} assets`}>
                                        <span style={{ width: `${(count / largestCategoryCount) * 100}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                    </div>
                                    <strong>{count}</strong>
                                </div>
                            ))}
                        </div>
                    ) : <p className="report-empty">No assets available for this filter.</p>}
                </article>

                <article className="report-card status-chart-card">
                    <div className="report-card-heading">
                        <div><h2>Asset status</h2><p>Current distribution</p></div>
                        <span className="chart-menu-mark" aria-hidden="true">•••</span>
                    </div>
                    <div className="status-chart-content">
                        <div className="status-donut" style={{ background: donutBackground }} role="img" aria-label="Donut chart showing asset status distribution">
                            <div className="status-donut-center"><strong>{filteredAssets.length}</strong><span>Total</span></div>
                        </div>
                        <ul className="status-legend">
                            {statusEntries.map(([status, count], index) => (
                                <li key={status}>
                                    <span className="legend-dot" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                    <span>{displayValue(status)}</span><strong>{count}</strong>
                                </li>
                            ))}
                            {!statusEntries.length && <li className="legend-empty">No status data</li>}
                        </ul>
                    </div>
                </article>
            </section>

            <section className="report-card condition-summary-card">
                <div className="report-card-heading">
                    <div><h2>Condition overview</h2><p>Asset health across the selected inventory</p></div>
                </div>
                <div className="condition-summary-list">
                    {[...conditionCounts.entries()].map(([condition, count]) => (
                        <div className="condition-summary-item" key={condition}>
                            <div className="condition-summary-copy"><span>{displayValue(condition)}</span><strong>{count}</strong></div>
                            <div className="condition-progress-track">
                                <span className={condition === "DAMAGED" ? "condition-progress-damaged" : "condition-progress-good"} style={{ width: `${filteredAssets.length ? (count / filteredAssets.length) * 100 : 0}%` }} />
                            </div>
                        </div>
                    ))}
                    {!conditionCounts.size && <p className="report-empty">No condition data available.</p>}
                </div>
            </section>

            <section className="report-card pivot-card">
                <div className="report-card-heading pivot-heading">
                    <div><h2>Inventory pivot table</h2><p>Cross-tabulate asset counts and totals</p></div>
                    <div className="pivot-controls">
                        <label className="report-filter"><span>Rows</span>
                            <select value={rowDimension} onChange={(event) => {
                                const nextRow = event.target.value;
                                setRowDimension(nextRow);
                                if (nextRow === columnDimension) {
                                    setColumnDimension(DIMENSIONS.find((dimension) => dimension.value !== nextRow)?.value || "assetStatus");
                                }
                            }}>
                                {DIMENSIONS.map((dimension) => <option key={dimension.value} value={dimension.value}>{dimension.label}</option>)}
                            </select>
                        </label>
                        <label className="report-filter"><span>Columns</span>
                            <select value={columnDimension} onChange={(event) => setColumnDimension(event.target.value)}>
                                {DIMENSIONS.filter((dimension) => dimension.value !== rowDimension).map((dimension) => <option key={dimension.value} value={dimension.value}>{dimension.label}</option>)}
                            </select>
                        </label>
                    </div>
                </div>
                <div className="pivot-table-wrap">
                    <table className="pivot-table">
                        <caption className="visually-hidden">Asset count by {DIMENSIONS.find((dimension) => dimension.value === rowDimension)?.label} and {DIMENSIONS.find((dimension) => dimension.value === columnDimension)?.label}</caption>
                        <thead>
                            <tr>
                                <th scope="col">{DIMENSIONS.find((dimension) => dimension.value === rowDimension)?.label}</th>
                                {pivotColumns.map((column) => <th scope="col" key={column}>{displayValue(column)}</th>)}
                                <th scope="col" className="pivot-total-heading">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pivot.rows.map((row) => (
                                <tr key={row.label}>
                                    <th scope="row">{displayValue(row.label)}</th>
                                    {row.counts.map((count, index) => <td key={`${row.label}-${pivotColumns[index]}`}>{count}</td>)}
                                    <td className="pivot-total-cell">{row.total}</td>
                                </tr>
                            ))}
                            {!pivot.rows.length && <tr><td className="pivot-empty" colSpan={pivotColumns.length + 2}>No data available for this report.</td></tr>}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th scope="row">Grand total</th>
                                {pivot.columnTotals.map((total, index) => <td key={`total-${pivotColumns[index]}`}>{total}</td>)}
                                <td className="pivot-total-cell">{pivot.grandTotal}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div className="pivot-footnote">Values represent the number of assets. Change the row and column fields to explore another view.</div>
            </section>
        </main>
    );
}

export default Reports;
