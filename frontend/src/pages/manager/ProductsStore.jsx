import React, { useState, useEffect } from "react";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import {
  getStoreProducts,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
  getStoreProductByUpc,
} from "../../services/productStoreService";
import { getProducts } from "../../services/productInfoService";
import axios from "axios";
import PrintPreviewModal from "../../components/PrintPreviewModal";

const EMPTY = {
  upc: "",
  upc_prom: "",
  id_product: "",
  selling_price: "",
  products_number: "",
  promotional_product: false,
};

const inputCls =
  "w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600 disabled:bg-gray-50 disabled:text-gray-400";
const labelCls =
  "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5";

export default function StoreProducts() {
  const [data, setData] = useState([]);
  const [baseProducts, setBaseProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [promoFilter, setPromoFilter] = useState("all");
  const [sortBy, setSortBy] = useState("quantity");
  const [modal, setModal] = useState({ open: false, mode: "add", row: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [printOpen, setPrintOpen] = useState(false);

  const [neverBought, setNeverBought] = useState(null);
  const [neverBoughtUpc, setNeverBoughtUpc] = useState("");
  const [neverBoughtLoading, setNeverBoughtLoading] = useState(false);
  const [neverBoughtError, setNeverBoughtError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [storeRes, baseRes] = await Promise.all([
        getStoreProducts(),
        getProducts(),
      ]);
      setData(storeRes.data);
      setBaseProducts(baseRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await loadData();
      } catch (err) {
        console.error(err);
      }
    };

    fetchInitialData();
  }, []);

  const openAdd = () => {
    setForm(EMPTY);
    setError("");
    setModal({ open: true, mode: "add", row: null });
  };
  const openEdit = (row) => {
    setForm({
      ...row,
      upc_prom: row.upc_prom || "",
    });
    setError("");
    setModal({ open: true, mode: "edit", row });
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Видалити товар з UPC ${row.upc}?`)) return;
    setError("");
    try {
      await deleteStoreProduct(row.upc);
      loadData();
    } catch (e) {
      setError(
        e.response?.data?.detail ||
          "Не вдалося видалити товар. Можливо, по ньому вже є пробиті чеки.",
      );
    }
  };

  const handleSubmit = async () => {
    if (
      !form.upc ||
      !form.id_product ||
      form.selling_price === "" ||
      form.products_number === ""
    ) {
      setError("Заповніть усі обов'язкові поля");
      return;
    }

    if (parseFloat(form.selling_price) < 0) {
      setError("Помилка: Ціна продажу не може бути від'ємною");
      return;
    }

    if (parseInt(form.products_number, 10) < 0) {
      setError("Помилка: Кількість одиниць не може бути від'ємною");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        id_product: Number(form.id_product),
        selling_price: parseFloat(form.selling_price),
        products_number: parseInt(form.products_number, 10),
        upc_prom: form.upc_prom.trim() === "" ? null : form.upc_prom,
      };

      modal.mode === "add"
        ? await createStoreProduct(payload)
        : await updateStoreProduct(modal.row.upc, payload);

      setModal({ open: false, mode: "add", row: null });
      loadData();
    } catch (e) {
      setError(e.response?.data?.detail || "Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  const filtered = data
    .map((p) => {
      const baseProd = baseProducts.find(
        (bp) => bp.id_product === p.id_product,
      );
      return {
        ...p,
        product_name:
          baseProd?.product_name || p.product_name || `ID: ${p.id_product}`,
        category_name:
          baseProd?.category_name || p.category_name || "Немає даних",
        manufacturer: baseProd?.manufacturer || p.manufacturer || "Немає даних",
        category_name:
          baseProd?.category_name || p.category_name || "Немає даних",
        characteristics: baseProd?.characteristics || "Немає даних",
      };
    })
    .filter((p) => {
      const nameMatch = p.product_name
        .toLowerCase()
        .includes(search.toLowerCase());
      const upcMatch = p.upc.toLowerCase().includes(search.toLowerCase());
      return nameMatch || upcMatch;
    })
    .filter((p) => {
      if (promoFilter === "promo") return p.promotional_product;
      if (promoFilter === "regular") return !p.promotional_product;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "quantity") {
        return a.products_number - b.products_number;
      } else {
        return a.product_name.localeCompare(b.product_name, "uk");
      }
    });

  const loadNeverBought = async (upc) => {
    const target = upc || neverBoughtUpc;
    if (!target.trim()) {
      setNeverBoughtError("Оберіть товар з таблиці або введіть UPC");
      return;
    }
    setNeverBoughtLoading(true);
    setNeverBoughtError("");
    setNeverBoughtUpc(target);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:8000/analytics/smyrnov/customers-never-bought/${target.trim()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNeverBought(res.data);
    } catch {
      setNeverBoughtError("Помилка завантаження");
      setNeverBought(null);
    } finally {
      setNeverBoughtLoading(false);
    }
  };

  const columns = [
    { key: "upc", label: "UPC (Штрих-код)" },
    { key: "product_name", label: "Назва товару" },
    { key: "category_name", label: "Категорія" },
    { key: "manufacturer", label: "Виробник" },
    { key: "characteristics", label: "Характеристики" },
    {
      key: "selling_price",
      label: "Ціна",
      render: (val) => `${Number(val).toFixed(2)} грн`,
    },
    { key: "products_number", label: "Кількість" },
    {
      key: "promotional_product",
      label: "Акція",
      render: (val) =>
        val ? <span className="text-blue-600 font-bold">Так</span> : "Ні",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Товари в магазині</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setPrintOpen(true)}
            className="px-4 py-2 text-sm font-bold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            🖨 Друк
          </button>
          <button
            onClick={openAdd}
            className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
          >
            + Додати
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 print:hidden">
        <input
          type="text"
          placeholder="Пошук за UPC або назвою товару"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-xs px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600"
        />

        <select
          value={promoFilter}
          onChange={(e) => setPromoFilter(e.target.value)}
          className="max-w-xs px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600"
        >
          <option value="all">Всі товари</option>
          <option value="regular">Звичайні</option>
          <option value="promo">Акційні</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="max-w-xs px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600"
        >
          <option value="quantity">Сортувати за кількістю</option>
          <option value="name">Сортувати за назвою</option>
        </select>
      </div>

      {error && !modal.open && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-2xl font-bold">Міні-супермаркет ZLAGODA</h1>
        <h2 className="text-lg">Звіт: Товари в магазині</h2>
        <p className="text-sm text-gray-500">Дата формування: {new Date().toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        onRowClick={(row) => loadNeverBought(row.upc)}
      />

      <div className="hidden print:flex justify-between mt-6 border-t pt-4 text-sm text-gray-500">
        <span>Міні-супермаркет «ZLAGODA» — Конфіденційний документ</span>
        <span className="font-bold">Всього позицій: {filtered.length}</span>
      </div>

      <div className="mt-8 print:hidden border border-gray-200 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-1">
          🔍 Клієнти, які ще не купували цей товар
        </h2>
        <p className="text-xs text-gray-400 mb-4">Введіть UPC вручну</p>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={neverBoughtUpc}
            onChange={(e) => setNeverBoughtUpc(e.target.value)}
            placeholder="UPC товару..."
            className="flex-1 max-w-xs px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600"
          />
          <button
            onClick={() => loadNeverBought()}
            disabled={neverBoughtLoading}
            className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            {neverBoughtLoading ? "Завантаження..." : "Знайти"}
          </button>
        </div>
        {neverBoughtError && (
          <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">
            {neverBoughtError}
          </div>
        )}
        {neverBought && neverBought.length === 0 && (
          <p className="text-sm text-gray-500">
            Усі клієнти вже купували цей товар
          </p>
        )}
        {neverBought && neverBought.length > 0 && (
          <table className="w-full text-sm text-left border border-gray-200 rounded">
            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-600">
              <tr>
                <th className="p-3">Номер картки</th>
                <th className="p-3">Клієнт</th>
                <th className="p-3">Телефон</th>
              </tr>
            </thead>
            <tbody>
              {neverBought.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="p-3 font-mono text-xs">{row.card_number}</td>
                  <td className="p-3 font-medium">
                    {row.cust_surname} {row.cust_name}
                  </td>
                  <td className="p-3 text-gray-500">{row.phone_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        title={
          modal.mode === "add" ? "Додати товар в магазин" : "Редагувати партію"
        }
        onSubmit={handleSubmit}
        loading={saving}
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>UPC *</label>
              <input
                type="text"
                value={form.upc}
                onChange={(e) => setForm({ ...form, upc: e.target.value })}
                disabled={modal.mode === "edit"}
                className={inputCls}
                placeholder="Введіть 12 символів"
                maxLength={12}
              />
            </div>
            <div>
              <label className={labelCls}>Базовий товар *</label>
              <select
                value={form.id_product}
                onChange={(e) =>
                  setForm({ ...form, id_product: e.target.value })
                }
                className={inputCls}
              >
                <option value="" disabled>
                  Оберіть з довідника...
                </option>
                {baseProducts.map((bp) => (
                  <option key={bp.id_product} value={bp.id_product}>
                    (ID: {bp.id_product}) {bp.category_name}. {bp.product_name}{" "}
                    від "{bp.manufacturer}" [{bp.characteristics}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ціна продажу (грн) *</label>
              <input
                type="number"
                step="0.01"
                value={form.selling_price}
                onChange={(e) =>
                  setForm({ ...form, selling_price: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Кількість одиниць *</label>
              <input
                type="number"
                value={form.products_number}
                onChange={(e) =>
                  setForm({ ...form, products_number: e.target.value })
                }
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.promotional_product}
                onChange={(e) =>
                  setForm({ ...form, promotional_product: e.target.checked })
                }
                className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-600"
              />
              <span className="text-sm font-bold text-gray-700">
                Акційний товар
              </span>
            </label>

            <div>
              <label className={labelCls}>UPC Акційного аналога</label>
              <input
                type="text"
                value={form.upc_prom}
                onChange={(e) => setForm({ ...form, upc_prom: e.target.value })}
                className={inputCls}
                placeholder="Опціонально"
                maxLength={12}
              />
            </div>
          </div>
        </div>
      </Modal>

      <PrintPreviewModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        title="Товари в магазині"
        subtitle={promoFilter !== 'all' ? (promoFilter === 'promo' ? 'Акційні' : 'Звичайні') : undefined}
        columns={columns}
        data={filtered}
      />
    </div>
  );
}
