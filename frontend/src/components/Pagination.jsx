import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    if (totalPages <= 1) {
        return null;
    }

    const getPaginationItems = () => {
        const pages = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }

            return pages;
        }

        pages.push(1);

        if (currentPage > 4) {
            pages.push("...");
        }

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(
            totalPages - 1,
            currentPage + 1
        );

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - 3) {
            pages.push("...");
        }

        pages.push(totalPages);

        return pages;
    };

    const paginationItems = getPaginationItems();

    return (
        <div className="flex flex-col gap-4 border-t border-zinc-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-xs font-medium text-zinc-400">
                Page{" "}
                <span className="font-semibold text-zinc-600">
                    {currentPage}
                </span>
                {" of "}
                <span className="font-semibold text-zinc-600">
                    {totalPages}
                </span>
            </p>

            <div className="flex items-center gap-1">

                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                        onPageChange(currentPage - 1)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition hover:border-[#40295C] hover:text-[#40295C] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={16} />
                </button>

                {paginationItems.map((page, index) => {
                    if (page === "...") {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className="flex h-9 w-9 items-center justify-center text-sm text-zinc-400"
                            >
                                ...
                            </span>
                        );
                    }

                    return (
                        <button
                            key={page}
                            type="button"
                            onClick={() =>
                                onPageChange(page)
                            }
                            className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition ${currentPage === page
                                    ? "bg-[#40295C] text-white"
                                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-[#40295C] hover:text-[#40295C]"
                                }`}
                        >
                            {page}
                        </button>
                    );
                })}

                <button
                    type="button"
                    disabled={
                        currentPage === totalPages
                    }
                    onClick={() =>
                        onPageChange(currentPage + 1)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition hover:border-[#40295C] hover:text-[#40295C] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;