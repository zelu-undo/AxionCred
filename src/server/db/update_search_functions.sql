-- Update search_customers function to use name_normalized and handle spaces
CREATE OR REPLACE FUNCTION search_customers(
    p_tenant_id UUID,
    p_search TEXT,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    document TEXT,
    phone TEXT,
    email TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Clean search term: trim, lowercase, and remove accents
    p_search := TRIM(COALESCE(p_search, ''));
    p_search := unaccent(LOWER(p_search));
    
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.document,
        c.phone,
        c.email,
        c.status,
        c.created_at
    FROM customers c
    WHERE c.tenant_id = p_tenant_id
    AND (
        -- Search by normalized name (accent insensitive and space-trimmed)
        COALESCE(c.name_normalized, unaccent(LOWER(c.name))) LIKE '%' || p_search || '%'
        -- OR search by document (normalize both: remove punctuation from search AND from DB)
        OR (
            -- Remove all non-digits from both search and stored document
            REGEXP_REPLACE(COALESCE(c.document, ''), '[^0-9]', '', 'g') LIKE '%' || REGEXP_REPLACE(p_search, '[^0-9]', '', 'g') || '%'
        )
    )
    ORDER BY c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Update search_customers_count function
CREATE OR REPLACE FUNCTION search_customers_count(
    p_tenant_id UUID,
    p_search TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Clean search term: trim, lowercase, and remove accents
    p_search := TRIM(COALESCE(p_search, ''));
    p_search := unaccent(LOWER(p_search));
    
    SELECT COUNT(*) INTO v_count
    FROM customers c
    WHERE c.tenant_id = p_tenant_id
    AND (
        -- Search by normalized name
        COALESCE(c.name_normalized, unaccent(LOWER(c.name))) LIKE '%' || p_search || '%'
        OR (
            REGEXP_REPLACE(COALESCE(c.document, ''), '[^0-9]', '', 'g') LIKE '%' || REGEXP_REPLACE(p_search, '[^0-9]', '', 'g') || '%'
        )
    );
    
    RETURN v_count;
END;
$$;
