'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// --- CATEGORIES ---

export async function getCategories(userId: string) {
    try {
        const categories = await prisma.productCategory.findMany({
            where: { userId },
            orderBy: { order: 'asc' },
            include: {
                products: {
                    orderBy: { order: 'asc' }
                },
                subCategories: {
                    orderBy: { order: 'asc' },
                    include: {
                        products: {
                            orderBy: { order: 'asc' }
                        }
                    }
                }
            }
        })
        return { success: true, categories }
    } catch (error: any) {
        console.error('Error getting categories:', error)
        return { success: false, error: 'Error al obtener categorías' }
    }
}

export async function createCategory(userId: string, name: string) {
    try {
        // Get max order
        const lastCategory = await prisma.productCategory.findFirst({
            where: { userId },
            orderBy: { order: 'desc' }
        })
        const newOrder = (lastCategory?.order ?? -1) + 1

        const category = await prisma.productCategory.create({
            data: {
                userId,
                name,
                order: newOrder
            }
        })

        revalidatePath('/dashboard/loyalty')
        return { success: true, category }
    } catch (error: any) {
        console.error('Error creating category:', error)
        return { success: false, error: 'Error al crear categoría' }
    }
}

export async function deleteCategory(categoryId: string, userId: string) {
    try {
        await prisma.productCategory.delete({
            where: { id: categoryId, userId } // Ensure ownership
        })

        revalidatePath('/dashboard/loyalty')
        return { success: true }
    } catch (error: any) {
        console.error('Error deleting category:', error)
        return { success: false, error: 'Error al eliminar categoría' }
    }
}

export async function createSubCategory(categoryId: string, name: string) {
    try {
        // Get max order
        const lastSub = await prisma.productSubCategory.findFirst({
            where: { categoryId },
            orderBy: { order: 'desc' }
        })
        const newOrder = (lastSub?.order ?? -1) + 1

        const subCategory = await prisma.productSubCategory.create({
            data: {
                categoryId,
                name,
                order: newOrder
            }
        })

        revalidatePath('/dashboard/loyalty')
        return { success: true, subCategory }
    } catch (error: any) {
        console.error('Error creating subcategory:', error)
        return { success: false, error: 'Error al crear subcategoría' }
    }
}

export async function deleteSubCategory(subCategoryId: string) {
    try {
        await prisma.productSubCategory.delete({
            where: { id: subCategoryId }
        })

        revalidatePath('/dashboard/loyalty')
        return { success: true }
    } catch (error: any) {
        console.error('Error deleting subcategory:', error)
        return { success: false, error: 'Error al eliminar subcategoría' }
    }
}

revalidatePath('/dashboard/loyalty')
return { success: true }
    } catch (error: any) {
    console.error('Error deleting category:', error)
    return { success: false, error: 'Error al eliminar categoría' }
}
}

// --- PRODUCTS ---

export async function upsertProduct(data: {
    id?: string
    userId: string
    categoryId: string
    subCategoryId?: string // Optional
    name: string
    description?: string
    price: number
    imageUrl?: string
}) {
    try {
        if (data.id) {
            // Update
            await prisma.product.update({
                where: { id: data.id, userId: data.userId },
                data: {
                    categoryId: data.categoryId,
                    subCategoryId: data.subCategoryId,
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    imageUrl: data.imageUrl
                }
            })
        } else {
            // Create
            // Get max order in category (or globally in category context)
            const lastProduct = await prisma.product.findFirst({
                where: { categoryId: data.categoryId },
                orderBy: { order: 'desc' }
            })
            const newOrder = (lastProduct?.order ?? -1) + 1

            await prisma.product.create({
                data: {
                    userId: data.userId,
                    categoryId: data.categoryId,
                    subCategoryId: data.subCategoryId,
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    imageUrl: data.imageUrl,
                    order: newOrder
                }
            })
        }

        revalidatePath('/dashboard/loyalty')
        return { success: true }
    } catch (error: any) {
        console.error('Error upserting product:', error)
        return { success: false, error: 'Error al guardar producto' }
    }
}

export async function deleteProduct(productId: string, userId: string) {
    try {
        await prisma.product.delete({
            where: { id: productId, userId }
        })

        revalidatePath('/dashboard/loyalty')
        return { success: true }
    } catch (error: any) {
        console.error('Error deleting product:', error)
        return { success: false, error: 'Error al eliminar producto' }
    }
}

export async function toggleProductStatus(productId: string, userId: string, isActive: boolean) {
    try {
        await prisma.product.update({
            where: { id: productId, userId },
            data: { isActive }
        })
        revalidatePath('/dashboard/loyalty')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: 'Error al actualizar estado' }
    }
}
