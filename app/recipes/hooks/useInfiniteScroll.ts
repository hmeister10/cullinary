import { useState, useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions<T> {
  data: T[]
  itemsPerPage?: number
  loadDelay?: number
}

export function useInfiniteScroll<T>({
  data,
  itemsPerPage = 8,
  loadDelay = 800
}: UseInfiniteScrollOptions<T>) {
  const [visibleItems, setVisibleItems] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)

  // Initialize with first batch of items
  useEffect(() => {
    setVisibleItems(data.slice(0, itemsPerPage))
    setPage(1)
    setHasMore(data.length > itemsPerPage)
  }, [data, itemsPerPage])

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loading) {
          loadMoreItems()
        }
      },
      { threshold: 0.1 }
    )

    const currentLoader = loaderRef.current
    if (currentLoader) {
      observer.observe(currentLoader)
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader)
      }
    }
  }, [hasMore, loading, data, page])

  // Load more items when scrolling
  const loadMoreItems = () => {
    setLoading(true)
    
    // Simulate network delay
    setTimeout(() => {
      const nextPage = page + 1
      const startIndex = 0
      const endIndex = nextPage * itemsPerPage
      const newItems = data.slice(startIndex, endIndex)
      
      setVisibleItems(newItems)
      setPage(nextPage)
      setHasMore(endIndex < data.length)
      setLoading(false)
    }, loadDelay)
  }

  // Handle manual load more button click
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadMoreItems()
    }
  }

  return {
    visibleItems,
    loading,
    hasMore,
    loaderRef,
    handleLoadMore
  }
} 