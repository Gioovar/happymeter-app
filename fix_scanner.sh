sed -i '' '774,785d' src/components/loyalty/StaffScanner.tsx
echo '                    )}' >> src/components/loyalty/StaffScanner.tsx
echo '                </div>' >> src/components/loyalty/StaffScanner.tsx
echo '                </>' >> src/components/loyalty/StaffScanner.tsx
echo '            )}' >> src/components/loyalty/StaffScanner.tsx
echo '        </div>' >> src/components/loyalty/StaffScanner.tsx
echo '    )' >> src/components/loyalty/StaffScanner.tsx
echo '}' >> src/components/loyalty/StaffScanner.tsx
sh fix_scanner.sh
npx tsc --noEmit
