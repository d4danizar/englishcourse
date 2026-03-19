module.exports = [
"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/users/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"405b28a2ce580d9828ff9a356633321e010eef87b5":"editUser","40af0a18bee1f2b9f96f214b5a4fdca8776034df1e":"deleteUser","40b43267ad66cb38fbc5143918b372df6b5d34b0b8":"createUser","40fe11af7cbeba686c847c80a9a3bf5bdc0391487f":"resetPassword"},"",""] */ __turbopack_context__.s([
    "createUser",
    ()=>createUser,
    "deleteUser",
    ()=>deleteUser,
    "editUser",
    ()=>editUser,
    "resetPassword",
    ()=>resetPassword
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/bcryptjs/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
async function createUser(formData) {
    try {
        const name = formData.get("name");
        const email = formData.get("email");
        const phoneNumber = formData.get("phoneNumber");
        const role = formData.get("role");
        const activeProgram = formData.get("activeProgram");
        const startDateStr = formData.get("startDate");
        const endDateStr = formData.get("endDate");
        const durationOption = formData.get("durationOption");
        const batchSchedule = formData.get("batchSchedule");
        if (!name || !email || !role) {
            return {
                error: "Name, email, and role are required."
            };
        }
        // Default password as requested
        const passwordHash = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].hash("kampunginggris123", 10);
        const isStudent = role === "STUDENT";
        await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.create({
            data: {
                name,
                email,
                phoneNumber: phoneNumber || null,
                role,
                passwordHash,
                activeProgram: isStudent && activeProgram ? activeProgram : null,
                startDate: isStudent && startDateStr ? new Date(startDateStr) : null,
                endDate: isStudent && endDateStr ? new Date(endDateStr) : null,
                durationOption: isStudent && durationOption ? durationOption : null,
                batchSchedule: isStudent && batchSchedule ? batchSchedule : null
            }
        });
        // Refresh the table UI automatically
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/users");
        return {
            success: true
        };
    } catch (error) {
        if (error.code === "P2002") {
            return {
                error: "Email already exists in the system."
            };
        }
        return {
            error: error.message || "Failed to create user."
        };
    }
}
async function editUser(formData) {
    try {
        const id = formData.get("id");
        const name = formData.get("name");
        const email = formData.get("email");
        const phoneNumber = formData.get("phoneNumber");
        const role = formData.get("role");
        // Student-specific fields
        const activeProgram = formData.get("activeProgram");
        const programBatch = formData.get("programBatch");
        const startDateStr = formData.get("startDate");
        const endDateStr = formData.get("endDate");
        const durationOption = formData.get("durationOption");
        const batchSchedule = formData.get("batchSchedule");
        if (!id || !name || !email || !role) {
            return {
                error: "ID, Name, email, and role are required."
            };
        }
        const isStudent = role === "STUDENT";
        await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.update({
            where: {
                id
            },
            data: {
                name,
                email,
                phoneNumber: phoneNumber || null,
                role,
                activeProgram: isStudent && activeProgram ? activeProgram : null,
                programBatch: isStudent && programBatch ? programBatch : null,
                startDate: isStudent && startDateStr ? new Date(startDateStr) : null,
                endDate: isStudent && endDateStr ? new Date(endDateStr) : null,
                durationOption: isStudent && durationOption ? durationOption : null,
                batchSchedule: isStudent && batchSchedule ? batchSchedule : null
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/users");
        return {
            success: true
        };
    } catch (error) {
        if (error.code === "P2002") {
            return {
                error: "Email already exists in the system."
            };
        }
        return {
            error: error.message || "Failed to edit user."
        };
    }
}
async function resetPassword(userId) {
    try {
        const passwordHash = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].hash("kampunginggris123", 10);
        await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.update({
            where: {
                id: userId
            },
            data: {
                passwordHash
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/users");
        return {
            success: true
        };
    } catch (error) {
        return {
            error: error.message || "Failed to reset password."
        };
    }
}
async function deleteUser(userId) {
    try {
        // Cascade delete: attendance records for this student
        await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].attendance.deleteMany({
            where: {
                studentId: userId
            }
        });
        // Delete sessions taught by this tutor (will cascade delete their attendances too)
        await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].session.deleteMany({
            where: {
                tutorId: userId
            }
        });
        await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.delete({
            where: {
                id: userId
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/users");
        return {
            success: true
        };
    } catch (error) {
        return {
            error: error.message || "Failed to delete user. Please check related records."
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createUser,
    editUser,
    resetPassword,
    deleteUser
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createUser, "40b43267ad66cb38fbc5143918b372df6b5d34b0b8", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(editUser, "405b28a2ce580d9828ff9a356633321e010eef87b5", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(resetPassword, "40fe11af7cbeba686c847c80a9a3bf5bdc0391487f", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteUser, "40af0a18bee1f2b9f96f214b5a4fdca8776034df1e", null);
}),
"[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(admin)/admin/users/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/users/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$users$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/users/actions.ts [app-rsc] (ecmascript)");
;
;
;
;
}),
"[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(admin)/admin/users/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/users/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "405b28a2ce580d9828ff9a356633321e010eef87b5",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$users$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["editUser"],
    "40af0a18bee1f2b9f96f214b5a4fdca8776034df1e",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$users$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteUser"],
    "40b43267ad66cb38fbc5143918b372df6b5d34b0b8",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$users$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createUser"],
    "40fe11af7cbeba686c847c80a9a3bf5bdc0391487f",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$users$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["resetPassword"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f2e$next$2d$internal$2f$server$2f$app$2f28$admin$292f$admin$2f$users$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$users$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(admin)/admin/users/page/actions.js { ACTIONS_MODULE0 => "[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/users/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$users$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/users/actions.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=Desktop_Belajar%20Programming_KampungInggris_edaea293._.js.map