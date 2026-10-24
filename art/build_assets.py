"""Builds the game's models in headless Blender and exports them as glTF.

Run with:  python art/build_assets.py   (needs the `bpy` package)

Conventions (Blender is Z-up, three.js Y-up; the glTF exporter converts):
  * Blender -Y becomes three.js +Z, the direction the skater faces (towards the camera).
  * Every skater part has its origin at its joint and hangs down -Z, matching src/skater.ts.
  * Props have their origin at ground level.
"""
import math
import os
import bpy
import bmesh
from mathutils import Vector, Matrix

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'models')
os.makedirs(OUT, exist_ok=True)

MATS = {}


def mat(name, rgb):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*srgb_to_linear(rgb), 1)
    bsdf.inputs['Roughness'].default_value = 0.8
    MATS[name] = m
    return m


def srgb_to_linear(rgb):
    def f(c):
        c = c / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(f(c) for c in rgb)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()


def finish(obj, material, smooth=True, subdiv=0):
    obj.data.materials.clear()
    obj.data.materials.append(material)
    if subdiv:
        mod = obj.modifiers.new('sub', 'SUBSURF')
        mod.levels = subdiv
        mod.render_levels = subdiv
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier='sub')
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
    else:
        for p in obj.data.polygons:
            p.use_smooth = False
    return obj


def apply_tf(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def cube(material, size, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.0, subdiv=0, smooth=True, segs=2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = size
    apply_tf(o)
    if bevel:
        m = o.modifiers.new('bev', 'BEVEL')
        m.width = bevel
        m.segments = segs
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier='bev')
    return finish(o, material, smooth, subdiv)


def sphere(material, r, loc=(0, 0, 0), scale=(1, 1, 1), segs=20, rings=12, smooth=True):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=segs, ring_count=rings)
    o = bpy.context.object
    o.scale = scale
    apply_tf(o)
    return finish(o, material, smooth)


def ico(material, r, loc=(0, 0, 0), scale=(1, 1, 1), sub=1, smooth=False, jitter=0.0, seed=0):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=r, location=(0, 0, 0), subdivisions=sub)
    o = bpy.context.object
    if jitter:
        import random
        rnd = random.Random(seed)
        for v in o.data.vertices:
            v.co *= 1 + (rnd.random() - 0.5) * jitter
    o.scale = scale
    o.location = loc
    apply_tf(o)
    return finish(o, material, smooth)


def cyl(material, r, depth, loc=(0, 0, 0), rot=(0, 0, 0), verts=16, r2=None, smooth=True, bevel=0.0):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    else:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object
    if bevel:
        m = o.modifiers.new('bev', 'BEVEL')
        m.width = bevel
        m.segments = 2
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier='bev')
    o = finish(o, material, smooth)
    if smooth:
        # Keep cylinder caps crisp.
        m = o.modifiers.new('ws', 'WEIGHTED_NORMAL') if hasattr(o.modifiers, 'new') else None
    return o


def capsule(material, r_top, r_bot, length, loc=(0, 0, 0), scale=(1, 1, 1), segs=16):
    """Tapered capsule from loc down to loc - length on Z."""
    bm = bmesh.new()
    rings = 10
    profile = []
    # top hemisphere
    for i in range(rings // 2 + 1):
        a = (math.pi / 2) * (1 - i / (rings // 2))
        profile.append((r_top * math.cos(a), -r_top + r_top * math.sin(a) * 1.0 + 0))
    # shift: top cap centre at -r_top
    profile = [(x, z) for x, z in profile]
    body_top = -r_top
    body_bot = -(length - r_bot)
    prof = []
    for i in range(rings // 2 + 1):
        a = (math.pi / 2) * (i / (rings // 2))
        prof.append((r_top * math.sin(a), body_top + r_top * math.cos(a)))
    for i in range(rings // 2 + 1):
        a = (math.pi / 2) * (i / (rings // 2))
        prof.append((r_bot * math.cos(a), body_bot - r_bot * math.sin(a)))
    ringsv = []
    for (pr, pz) in prof:
        ring = []
        for s in range(segs):
            t = 2 * math.pi * s / segs
            ring.append(bm.verts.new((pr * math.cos(t), pr * math.sin(t), pz)))
        ringsv.append(ring)
    for a, b in zip(ringsv, ringsv[1:]):
        for s in range(segs):
            bm.faces.new((a[s], a[(s + 1) % segs], b[(s + 1) % segs], b[s]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    me = bpy.data.meshes.new('cap')
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('cap', me)
    bpy.context.collection.objects.link(o)
    o.scale = scale
    o.location = loc
    apply_tf(o)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    return finish(o, material, True)


def join(name, objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    o = bpy.context.object
    o.name = name
    o.data.name = name
    return o


def export(path, objects=None):
    bpy.ops.object.select_all(action='DESELECT')
    for o in (objects or bpy.context.scene.objects):
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', use_selection=True,
        export_apply=True, export_yup=True, export_materials='EXPORT',
    )
    print('wrote', path, os.path.getsize(path), 'bytes')


# ---------------------------------------------------------------- skater

def build_skater():
    reset()
    skin = mat('skin', (240, 192, 154))
    shirt = mat('shirt', (47, 143, 216))
    shirt_dk = mat('shirt_dark', (30, 104, 166))
    pants = mat('pants', (52, 62, 82))
    pants_dk = mat('pants_dark', (38, 45, 60))
    shoe_m = mat('shoe', (245, 245, 240))
    sole = mat('sole', (60, 50, 45))
    lace = mat('shoe_accent', (232, 64, 42))
    cap_m = mat('cap', (232, 64, 42))
    hair = mat('hair', (92, 58, 36))
    eye = mat('eye', (30, 30, 34))

    parts = []

    # Pelvis: centred on the hip line, belt and seat.
    p = [
        capsule(pants, 0.15, 0.15, 0.26, loc=(0, 0, 0.13), scale=(1.15, 0.85, 1)),
        cyl(pants_dk, 0.165, 0.05, loc=(0, 0, 0.1), verts=24, r2=None),
    ]
    p[1].scale = (1.12, 0.84, 1)
    apply_tf(p[1])
    parts.append(join('pelvis', p))

    # Torso: hoodie-ish shirt from waist (0) to neck (0.5), shoulders at 0.44.
    t = [
        capsule(shirt, 0.19, 0.16, 0.55, loc=(0, 0, 0.55), scale=(1.2, 0.78, 1)),
        cyl(shirt_dk, 0.17, 0.06, loc=(0, 0, 0.03), verts=24),
        sphere(shirt, 0.08, loc=(0.2, 0, 0.43), segs=12, rings=8),
        sphere(shirt, 0.08, loc=(-0.2, 0, 0.43), segs=12, rings=8),
        cyl(skin, 0.05, 0.08, loc=(0, 0, 0.5), verts=12),
    ]
    t[1].scale = (1.12, 0.8, 1)
    apply_tf(t[1])
    parts.append(join('torso', t))

    # Head: neck pivot at 0, skull centred at 0.16, cap with brim facing -Y.
    h = [
        sphere(skin, 0.125, loc=(0, 0, 0.16), scale=(0.95, 1, 1.05), segs=24, rings=16),
        sphere(cap_m, 0.132, loc=(0, 0, 0.185), scale=(1, 1.02, 0.85), segs=24, rings=16),
        cube(cap_m, (0.17, 0.12, 0.018), loc=(0, -0.155, 0.19), rot=(math.radians(-8), 0, 0), bevel=0.008),
        sphere(hair, 0.05, loc=(0.1, 0.04, 0.13), segs=10, rings=6),
        sphere(hair, 0.05, loc=(-0.1, 0.04, 0.13), segs=10, rings=6),
        sphere(eye, 0.016, loc=(0.042, -0.115, 0.16), segs=10, rings=6),
        sphere(eye, 0.016, loc=(-0.042, -0.115, 0.16), segs=10, rings=6),
        sphere(skin, 0.022, loc=(0, -0.125, 0.135), segs=10, rings=6),
        sphere(skin, 0.03, loc=(0.122, 0, 0.15), scale=(0.5, 1, 1.2), segs=10, rings=6),
        sphere(skin, 0.03, loc=(-0.122, 0, 0.15), scale=(0.5, 1, 1.2), segs=10, rings=6),
    ]
    parts.append(join('head', h))

    # Arms: sleeve on the upper arm, forearm with a hand.
    for s in ('L', 'R'):
        parts.append(join(f'upperArm_{s}', [
            capsule(shirt, 0.058, 0.05, 0.31, loc=(0, 0, 0.02)),
        ]))
        parts.append(join(f'forearm_{s}', [
            capsule(skin, 0.045, 0.038, 0.26, loc=(0, 0, 0.0)),
            cyl(shirt_dk, 0.052, 0.04, loc=(0, 0, -0.01), verts=12),
            sphere(skin, 0.055, loc=(0, -0.005, -0.29), scale=(0.75, 0.6, 1), segs=12, rings=8),
        ]))

    # Legs: baggy jeans, cuffs on the shins.
    for s in ('L', 'R'):
        parts.append(join(f'thigh_{s}', [capsule(pants, 0.085, 0.07, 0.47, loc=(0, 0, 0.02))]))
        parts.append(join(f'shin_{s}', [
            capsule(pants, 0.07, 0.072, 0.44, loc=(0, 0, 0.0)),
            cyl(pants_dk, 0.076, 0.05, loc=(0, 0, -0.39), verts=16),
        ]))
        # Shoe: ankle at origin, toes towards -Y (the camera), sole at -0.075.
        parts.append(join(f'shoe_{s}', [
            cube(shoe_m, (0.115, 0.28, 0.075), loc=(0, -0.035, -0.035), bevel=0.025, segs=3),
            cube(sole, (0.12, 0.29, 0.022), loc=(0, -0.035, -0.07), bevel=0.008),
            cube(lace, (0.06, 0.1, 0.02), loc=(0, -0.09, 0.0), bevel=0.008),
            cyl(shoe_m, 0.055, 0.07, loc=(0, 0.03, 0.0), verts=14),
        ]))

    # Deck: origin on the ground under the wheels, deck top at 0.115.
    parts.append(build_board())
    export(os.path.join(OUT, 'skater.glb'), parts)


def build_board():
    deck_m = mat('deck_grip', (34, 34, 38))
    wood = mat('deck_wood', (216, 140, 58))
    graphic = mat('deck_graphic', (232, 64, 42))
    metal = mat('truck', (184, 190, 198))
    wheel_m = mat('wheel', (245, 230, 168))

    # Deck outline: popsicle shape, kicked nose and tail, slight concave.
    L, W, T = 0.8, 0.21, 0.016
    nx, ny = 40, 8
    bm = bmesh.new()
    top, bot = [], []
    for i in range(nx + 1):
        u = i / nx * 2 - 1  # -1..1 along length
        x = u * L / 2
        half = W / 2
        end = max(0.0, abs(u) - 0.78) / 0.22
        width = half * math.sqrt(max(0.0, 1 - end * end)) if end > 0 else half
        width = max(width, 0.004)
        kick = 0.0
        if abs(u) > 0.62:
            k = (abs(u) - 0.62) / 0.38
            kick = 0.07 * k * k
        rt, rb = [], []
        for j in range(ny + 1):
            v = j / ny * 2 - 1
            y = v * width
            concave = 0.006 * (v * v)
            z = 0.1 + kick + concave
            rt.append(bm.verts.new((x, y, z + T / 2)))
            rb.append(bm.verts.new((x, y, z - T / 2)))
        top.append(rt)
        bot.append(rb)
    faces_top, faces_bot = [], []
    for i in range(nx):
        for j in range(ny):
            faces_top.append(bm.faces.new((top[i][j], top[i + 1][j], top[i + 1][j + 1], top[i][j + 1])))
            faces_bot.append(bm.faces.new((bot[i][j], bot[i][j + 1], bot[i + 1][j + 1], bot[i + 1][j])))
    for i in range(nx):
        bm.faces.new((top[i][0], bot[i][0], bot[i + 1][0], top[i + 1][0]))
        bm.faces.new((top[i][ny], top[i + 1][ny], bot[i + 1][ny], bot[i][ny]))
    for i in (0, nx):
        for j in range(ny):
            f = (top[i][j], top[i][j + 1], bot[i][j + 1], bot[i][j])
            bm.faces.new(f if i == nx else f[::-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        n = f.normal
        f.material_index = 0 if n.z > 0.5 else (1 if n.z < -0.5 else 2)
        c = f.calc_center_median()
        if f.material_index == 1 and abs(c.x) < 0.22:
            f.material_index = 3
    me = bpy.data.meshes.new('deck')
    bm.to_mesh(me)
    bm.free()
    deck = bpy.data.objects.new('deck_body', me)
    bpy.context.collection.objects.link(deck)
    for m in (deck_m, wood, wood, graphic):
        deck.data.materials.append(m)
    for p in deck.data.polygons:
        p.use_smooth = True

    bits = [deck]
    for s in (-1, 1):
        x = s * 0.25
        bits.append(cube(metal, (0.06, 0.06, 0.012), loc=(x, 0, 0.086), bevel=0.004))
        bits.append(cube(metal, (0.035, 0.05, 0.035), loc=(x, 0, 0.065), bevel=0.008))
        bits.append(cube(metal, (0.03, 0.17, 0.024), loc=(x, 0, 0.042), bevel=0.01))
        bits.append(cyl(metal, 0.006, 0.23, loc=(x, 0, 0.03), rot=(math.pi / 2, 0, 0), verts=8))
        for y in (-0.1, 0.1):
            bits.append(cyl(wheel_m, 0.03, 0.034, loc=(x, y, 0.03), rot=(math.pi / 2, 0, 0), verts=20, bevel=0.008))
    return join('deck', bits)


# ---------------------------------------------------------------- props

def build_props():
    reset()
    out = []
    bark = mat('bark', (122, 82, 50))
    leaf = mat('leaf', (63, 154, 69))
    leaf2 = mat('leaf_light', (92, 184, 84))
    leaf3 = mat('leaf_dark', (48, 128, 62))
    rock_m = mat('rock', (150, 152, 156))
    wood = mat('fence_wood', (197, 139, 82))
    wood_dk = mat('fence_wood_dark', (160, 108, 60))
    steel = mat('lamp_steel', (60, 70, 82))
    light = mat('lamp_light', (255, 243, 176))
    cone_m = mat('cone', (255, 122, 26))
    white = mat('white', (245, 245, 245))
    bench_wood = mat('bench_wood', (181, 112, 58))
    iron = mat('iron', (68, 68, 72))

    # Tree: tapered trunk with a couple of branches and a lumpy crown.
    trunk = cyl(bark, 0.22, 2.2, loc=(0, 0, 1.1), r2=0.12, verts=10)
    br1 = cyl(bark, 0.08, 0.9, loc=(0.25, 0, 1.9), rot=(0, math.radians(40), 0), r2=0.04, verts=8)
    br2 = cyl(bark, 0.07, 0.8, loc=(-0.22, 0.05, 2.0), rot=(0, math.radians(-35), 0), r2=0.035, verts=8)
    crown = [
        ico(leaf, 1.25, loc=(0, 0, 3.0), sub=2, jitter=0.25, seed=1, smooth=True),
        ico(leaf2, 0.9, loc=(0.7, -0.3, 3.5), sub=2, jitter=0.25, seed=2, smooth=True),
        ico(leaf3, 0.95, loc=(-0.7, 0.2, 2.8), sub=2, jitter=0.25, seed=3, smooth=True),
        ico(leaf2, 0.75, loc=(0.1, -0.4, 3.9), sub=2, jitter=0.25, seed=4, smooth=True),
    ]
    out.append(join('tree', [trunk, br1, br2] + crown))

    # Pine tree variant reads well in the distance.
    pine = [cyl(bark, 0.14, 1.0, loc=(0, 0, 0.5), verts=8)]
    for i, (r, z) in enumerate([(1.1, 1.3), (0.85, 2.1), (0.6, 2.8)]):
        pine.append(cyl(leaf3 if i % 2 == 0 else leaf, r, 1.2, loc=(0, 0, z), r2=0.05, verts=9, smooth=False))
    out.append(join('pine', pine))

    out.append(join('bush', [
        ico(leaf, 0.6, loc=(0, 0, 0.42), sub=2, jitter=0.3, seed=5, smooth=True),
        ico(leaf2, 0.45, loc=(0.5, -0.1, 0.32), sub=2, jitter=0.3, seed=6, smooth=True),
        ico(leaf3, 0.42, loc=(-0.45, 0.1, 0.3), sub=2, jitter=0.3, seed=7, smooth=True),
    ]))

    out.append(join('rock', [
        ico(rock_m, 0.55, loc=(0, 0, 0.2), scale=(1.2, 0.9, 0.65), sub=1, jitter=0.35, seed=8),
        ico(rock_m, 0.3, loc=(0.55, 0.15, 0.1), scale=(1, 0.9, 0.7), sub=1, jitter=0.35, seed=9),
    ]))

    # Fence: one 2.4 m bay, post on the left, two rails.
    out.append(join('fence', [
        cube(wood_dk, (0.12, 0.12, 1.05), loc=(-1.2, 0, 0.52), bevel=0.015),
        cube(wood_dk, (0.14, 0.14, 0.04), loc=(-1.2, 0, 1.06), bevel=0.01),
        cube(wood, (2.4, 0.05, 0.11), loc=(0, 0.04, 0.78), bevel=0.012),
        cube(wood, (2.4, 0.05, 0.11), loc=(0, 0.04, 0.42), bevel=0.012),
    ]))

    # Lamp post with an arm reaching over the track (+X is along the track, -Y towards camera).
    out.append(join('lamp', [
        cyl(steel, 0.11, 0.25, loc=(0, 0, 0.12), verts=12),
        cyl(steel, 0.06, 4.0, loc=(0, 0, 2.1), r2=0.045, verts=12),
        cyl(steel, 0.035, 0.9, loc=(0, -0.42, 4.05), rot=(math.radians(90), 0, 0), verts=8),
        cube(steel, (0.3, 0.42, 0.12), loc=(0, -0.85, 4.02), bevel=0.03),
        cube(light, (0.24, 0.34, 0.03), loc=(0, -0.85, 3.95), bevel=0.01),
    ]))

    out.append(join('cone', [
        cube(cone_m, (0.42, 0.42, 0.04), loc=(0, 0, 0.02), bevel=0.01),
        cyl(cone_m, 0.17, 0.55, loc=(0, 0, 0.3), r2=0.025, verts=16),
        cyl(white, 0.122, 0.09, loc=(0, 0, 0.3), r2=0.1, verts=16),
    ]))

    out.append(join('bench', [
        cube(bench_wood, (1.7, 0.12, 0.05), loc=(0, -0.12, 0.46), bevel=0.012),
        cube(bench_wood, (1.7, 0.12, 0.05), loc=(0, 0.04, 0.46), bevel=0.012),
        cube(bench_wood, (1.7, 0.05, 0.12), loc=(0, 0.17, 0.72), bevel=0.012),
        cube(bench_wood, (1.7, 0.05, 0.12), loc=(0, 0.19, 0.88), bevel=0.012),
        cube(iron, (0.06, 0.4, 0.06), loc=(-0.72, 0, 0.42), bevel=0.01),
        cube(iron, (0.06, 0.4, 0.06), loc=(0.72, 0, 0.42), bevel=0.01),
        cube(iron, (0.06, 0.06, 0.45), loc=(-0.72, -0.16, 0.22), bevel=0.01),
        cube(iron, (0.06, 0.06, 0.45), loc=(0.72, -0.16, 0.22), bevel=0.01),
        cube(iron, (0.06, 0.06, 0.95), loc=(-0.72, 0.16, 0.47), bevel=0.01),
        cube(iron, (0.06, 0.06, 0.95), loc=(0.72, 0.16, 0.47), bevel=0.01),
    ]))

    export(os.path.join(OUT, 'props.glb'), out)


if __name__ == '__main__':
    build_skater()
    build_props()
